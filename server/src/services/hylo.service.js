/* eslint-disable no-unreachable */
import boom from '@hapi/boom';
import axios from 'axios';
import { ObjectId } from 'mongodb';
import querystring from 'querystring';

import * as utils from '../helpers/surveys';

import { db } from '../db';
import { request, gql } from 'graphql-request';

export const getToken = async () => {
  const r = await axios.post(
    `${process.env.HYLO_API_URL}/noo/oauth/token`,
    querystring.stringify({
      client_secret: process.env.HYLO_CLIENT_SECRET,
      scope: 'api:write',
      resource: 'https://hylo.com ',
      audience: 'https://hylo.com',
      grant_type: 'client_credentials',
      client_id: 'openteam',
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return r.data;
};

const gqlPostConfig = async () => {
  return {
    headers: {
      Authorization: `Bearer ${(await getToken()).access_token}`,
      'Content-Type': 'application/json',
    },
  };
};

const getGqlAuthHeaders = async () => {
  return {
    Authorization: `Bearer ${(await getToken()).access_token}`,
  };
};

export const gqlRequest = async (query, variables) => {
  return request(
    `${process.env.HYLO_API_URL}/noo/graphql`,
    query,
    variables,
    await getGqlAuthHeaders()
  );
};

const createHyloUser = async ({ email, name, groupId }) => {
  const r = await axios.post(
    `${process.env.HYLO_API_URL}/noo/user`,
    querystring.stringify({ email, name, groupId }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: (await gqlPostConfig()).headers.Authorization,
      },
    }
  );
  return r.data;
};

const queryHyloUser = async (email) => {
  return gqlRequest(
    gql`
      query ($id: ID, $email: String) {
        person(id: $id, email: $email) {
          id
          name
          hasRegistered
        }
      }
    `,
    { email }
  );
};

const FRAGMENT_GROUP_DETAILS = gql`
  fragment GroupDetails on Group {
    id
    name
    slug
    members {
      items {
        id
        name
        hasRegistered
      }
    }
  }
`;

const queryHyloGroup = async (slug) => {
  return gqlRequest(
    gql`
      query ($id: ID, $slug: String) {
        group(id: $id, slug: $slug) {
          ...GroupDetails
        }
      }
      ${FRAGMENT_GROUP_DETAILS}
    `,
    { slug }
  );
};

const createHyloGroup = async ({ name, slug, farm_email, hyloUserId }) => {
  return gqlRequest(
    gql`
      mutation ($data: GroupInput, $asUserId: ID) {
        group: createGroup(data: $data, asUserId: $asUserId) {
          ...GroupDetails
        }
      }
      ${FRAGMENT_GROUP_DETAILS}
    `,
    {
      data: {
        accessibility: 1,
        name,
        slug,
        parentIds: [],
        visibility: 1,
        groupExtensions: [
          {
            type: 'farm-onboarding',
            data: {
              // TODO ask Tibet if this should work?
              farm_email,
            },
          },
        ],
      },
      asUserId: hyloUserId,
    }
  );
};

const updateHyloGroup = async ({ name, farm_email, hyloUserId, hyloGroupId }) => {
  return gqlRequest(
    gql`
      mutation ($id: ID, $changes: GroupInput, $asUserId: ID) {
        group: updateGroup(id: $id, changes: $changes, asUserId: $asUserId) {
          ...GroupDetails
        }
      }
      ${FRAGMENT_GROUP_DETAILS}
    `,
    {
      id: hyloGroupId,
      changes: {
        name,
        groupExtensions: [
          {
            type: 'farm-onboarding',
            data: {
              farm_email,
            },
          },
        ],
      },
      asUserId: hyloUserId,
    }
  );
};

const syncUserWithHylo = async (id) => {
  const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
  if (!user) {
    throw new Error('TODO');
  }
  let hyloUser = await createHyloUser({
    email: user.email,
    name: user.name,
  });

  // if user already exists
  if (!hyloUser?.id) {
    const { person } = await queryHyloUser(user.email);
    hyloUser = person;
  }

  if (!hyloUser?.id) {
    throw new Error("Hylo didn't return an ID for the user");
  }

  return hyloUser;
};

const syncGroupWithHylo = async ({ name, slug, farm_url, hyloUserId }) => {
  let group = null;
  try {
    group = (await createHyloGroup({ name, slug, farm_url, hyloUserId })).group;
  } catch (e) {
    if (
      !e.response?.errors?.some((e) => e.message === 'A group with that URL slug already exists')
    ) {
      console.error(e);
    }
  }
  console.log('group after create', { group });
  if (!group?.id) {
    group = (await queryHyloGroup(slug)).group;
    if (!group?.id) {
      throw new Error(`Failed to create a Hylo group with slug "${slug}`);
    }
    group = await updateHyloGroup({ name, farm_url, hyloUserId, hyloGroupId: group.id });
  }
  return group;
};

// getToken().then((t) => console.log('Token', t));
// createHyloUser({ name: 'azazdeaz test 6', email: 'user6@azazdeaz.test' }).then((t) =>
//   console.log('NEW USER', t)
// );
// queryHyloUser('user3@azazdeaz.test').then((t) => console.log('USER', t));
// const group = createHyloGroup('azazdeaz-test-group-5', '36341').then((t) => {
//   console.log('NEW GROUP', JSON.stringify(t, null, 2));
//   return t;
// });
// queryHyloGroup('azazdeaz-test-group-2').then((t) => console.log('GROUP', t));
// updateHyloGroup('34844', '36341').then((t) => {
//   console.log('UPDAATED GROUP', JSON.stringify(t, null, 2));
//   return t;
// });

export const handle = async ({ submission, survey, user }) => {
  const surveyVersion = submission.meta.survey.version;

  console.log('submission-hylo', JSON.stringify(submission, null, 2));

  const { controls } = survey.revisions.find((revision) => revision.version === surveyVersion);
  const positions = utils.getControlPositions(controls);

  const hyloCompose = positions
    .map((position) => {
      const control = utils.getControl(controls, position);
      if (!control.options.apiCompose || !control.options.apiCompose.enabled) {
        return [];
      }

      const field = utils.getSubmissionField(submission, survey, position);

      const compose = [];

      if (field.meta.relevant === false) {
        return [];
      }

      if (!field.meta.apiCompose) {
        return [];
      }

      if (Array.isArray(field.meta.apiCompose)) {
        for (const c of field.meta.apiCompose) {
          compose.push(c);
        }
      } else if (typeof field.meta.apiCompose === 'object') {
        compose.push(field.meta.apiCompose);
      } else {
        return [];
      }

      const relevantApiCompose = compose.filter((c) => c.type === 'hylo');
      if (relevantApiCompose.length === 0) {
        return [];
      }

      return compose;
    })
    .flat();

  const results = [];
  for (const { hyloType, body } of hyloCompose) {
    if (hyloType === 'sync-group') {
      const { name, slug, farm_email } = body;
      if (typeof name !== 'string') {
        throw boom.badData(`name is not a string: ${name}`);
      }
      if (typeof slug !== 'string') {
        throw boom.badData(`slug is not a string: ${slug}`);
      }
      if (typeof farm_email !== 'string') {
        throw boom.badData(`farm_email is not a string: ${farm_email}`);
      }

      console.log('do the thing with', { name, slug, farm_email });
      console.log('as user', JSON.stringify(user, null, 2));

      const hyloUser = await syncUserWithHylo(user._id);
      console.log({ hyloUser });

      const hyloGroup = await syncGroupWithHylo({
        name,
        slug,
        farm_email,
        hyloUserId: hyloUser.id,
      });
      results.push({ hyloUser, hyloGroup });
    }
  }
  console.log('RESULTS', JSON.stringify(results, null, 2));

  // TODO does results have an expected format?
  return results;
};
