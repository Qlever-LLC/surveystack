/* eslint-disable no-unreachable */
import boom from '@hapi/boom';
import axios from 'axios';
import https from 'https';
import querystring from 'querystring';

import * as utils from '../helpers/surveys';

import { hasPermission } from './farmos-2/apiCompose';
import { aggregator } from './farmos-2/aggregator';
import { db } from '../db';

const getToken = async () => {
  const r = await axios.post(
    `https://staging.hylo.com/noo/oauth/token`,
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

const gqlHeaders = async () => {
  return {
    headers: {
      Authorization: `Bearer ${(await getToken()).access_token}`,
      'Content-Type': 'application/json',
    },
  };
};

const createHyloUser = async ({ email, name, groupId }) => {
  const r = await axios.post(
    `https://staging.hylo.com/noo/user`,
    querystring.stringify({ email, name, groupId }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return r.data;
};

const queryHyloUser = async (email) => {
  const r = await axios.post(
    `https://staging.hylo.com/noo/graphql`,
    JSON.stringify({
      query:
        'query ($id: ID, $email: String) { person(id: $id, email: $email) { id name hasRegistered } }',
      variables: {
        // It uses the email OR the id (email if both set)
        email,
        // "id": PERSON_ID
      },
    }),
    await gqlHeaders()
  );

  return r.data;
};

const queryHyloGroup = async (slug) => {
  const r = await axios.post(
    `https://staging.hylo.com/noo/graphql`,
    JSON.stringify({
      query:
        'query ($id: ID, $slug: String) { group(id: $id, slug: $slug) { id name slug members { id name hasRegistered } } }',
      variables: {
        // It uses the slug OR the id (slug if both set)
        slug: 'GROUP_SLUG',
        // "id": GROUP_ID
      },
    }),
    await gqlHeaders()
  );

  return r.data;
};

const upsertHyloUser = async (email) => {};
// getToken().then(t => console.log("Token", t))
// createHyloUser({name: "azazdeaz test 1", email: "user2@azazdeaz.test"}).then(t => console.log("NEW USER", t))
// queryHyloUser().then(t => console.log("USER", t))
// queryHyloGroup().then(t => console.log("GROUP", t))

const config = () => {
  if (!process.env.FARMOS_AGGREGATOR_URL || !process.env.FARMOS_AGGREGATOR_APIKEY) {
    console.log('env not set');
    return;
  }

  return aggregator(process.env.FARMOS_AGGREGATOR_URL, process.env.FARMOS_AGGREGATOR_APIKEY);
};

function allowed(instanceName, user) {
  const url = instanceName;
  if (typeof url != 'string') {
    throw boom.badData(`url is not a string: ${url}`);
  }

  return hasPermission(user, url);
}

async function flushlogs(instanceName, user, id) {
  /**
   * TODO Group Admins should have access
   */

  const url = instanceName;
  if (typeof url != 'string') {
    throw boom.badData(`url is not a string: ${url}`);
  }

  if (!allowed(instanceName, user)) {
    throw boom.unauthorized('No Access to farm');
  }

  const { deleteAllWithData } = config();

  console.log('deleting data', instanceName, id);
  const res = await deleteAllWithData(instanceName, id);
  console.log('done');
  return [res];
}

async function fetchTerms(instanceName, credentials, user) {
  const url = instanceName;
  if (typeof url != 'string') {
    throw boom.badData(`url is not a string: ${url}`);
  }

  if (!allowed(instanceName, user)) {
    throw boom.unauthorized('No Access to farm');
  }

  // TODO fetch terms
}

async function execute(aggregator, apiCompose, info, terms, user, submission) {
  console.log('executing apiCompose', apiCompose);

  const url = apiCompose.url;
  if (typeof url != 'string') {
    throw boom.badData(`url is not a string: ${url}`);
  }

  if (!allowed(url, user)) {
    throw boom.unauthorized(`User has no access to farm: ${url}`);
  }

  if (!apiCompose.entity || !apiCompose.entity.type) {
    throw boom.badData('apiCompose: missing entity or entity.type');
  }

  const [endpoint, bundle] = apiCompose.entity.type.split('--');

  if (!endpoint || !bundle) {
    throw boom.badData('apiCompose.entity.type should be in the form endpoint--bundle');
  }

  // TODO
  // create log / assets / profile ....

  const payload = { data: apiCompose.entity };
  payload.data.attributes.data = submission._id;

  return await aggregator.create(url, endpoint, bundle, payload);
}

export const handle = async ({ submission, survey, user }) => {
  const surveyVersion = submission.meta.survey.version;

  console.log('submission', JSON.stringify(submission, null, 2));

  const { controls } = survey.revisions.find((revision) => revision.version === surveyVersion);
  const positions = utils.getControlPositions(controls);

  const farmOsCompose = [];
  positions.forEach((position) => {
    const control = utils.getControl(controls, position);
    if (!control.options.apiCompose || !control.options.apiCompose.enabled) {
      return;
    }

    const field = utils.getSubmissionField(submission, survey, position);

    const compose = [];

    if (field.meta.relevant === false) {
      return;
    }

    if (!field.meta.apiCompose) {
      return;
    }

    if (Array.isArray(field.meta.apiCompose)) {
      for (const c of field.meta.apiCompose) {
        compose.push(c);
      }
    } else if (typeof field.meta.apiCompose === 'object') {
      compose.push(field.meta.apiCompose);
    } else {
      return;
    }

    const relevantApiCompose = compose.filter((c) => c.type !== undefined && c.type === 'farmos');
    if (relevantApiCompose.length === 0) {
      return;
    }

    farmOsCompose.push(...compose);
  });

  if (farmOsCompose.length === 0) {
    return [];
  }

  const results = [];

  // TODO adapt to farmos 2.0

  const aggregator = config();

  const runSingle = async (apiCompose, info, terms) => {
    try {
      const r = await execute(aggregator, apiCompose, info, terms, user, submission);

      if (Array.isArray(r)) {
        results.push(...r);
        console.log('results interim after array spread', results);
        return r;
      } else {
        results.push(r);
        console.log('results interim after single add', results);
        return [r];
      }
    } catch (error) {
      console.log('error in run single', error);
      results.push({
        status: 'error',
        error,
      });
      return null;
    }
  };

  // TODO find for each instance relevant farm information

  const farmUrlMap = {};
  farmOsCompose.forEach((c) => {
    if (typeof c.url !== 'string') {
      throw boom.badData(`url is not a string: ${c.url}`);
    }
    const items = farmUrlMap[c.url];
    farmUrlMap[c.url] = items === undefined ? 1 : items + 1;
  });

  for (const farmUrl of Object.keys(farmUrlMap)) {
    const res = await flushlogs(farmUrl, user, submission._id);
    if (res.length > 0) {
      results.push(res);
    }
  }
  for (const compose of farmOsCompose) {
    const info = {};
    const terms = {};

    const r = await runSingle(compose, info, terms);
  }

  console.log('results', results);
  return results;
};

const testAggregatorConnection = async (url, apiKey) => {
  const agentOptions = {
    host: url,
    port: '443',
    path: '/',
    rejectUnauthorized: false,
  };

  const agent = new https.Agent(agentOptions);

  const r = await axios.get(`https://${url}/api/v2/farms/`, {
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
    },
    httpsAgent: agent,
  });

  if (r.status === 200) {
    return true;
  } else {
    throw Error('unable to connect to aggregator');
  }
};

const isFarmosUrlAvailable = async (url, apiKey) => {
  const agentOptions = {
    host: 'account.farmos.net',
    port: '443',
    path: '/',
    rejectUnauthorized: false,
  };

  const agent = new https.Agent(agentOptions);

  try {
    const r = await axios.post(
      `https://account.farmos.net/api/v1/utils/validate-farm-url`,
      {
        url: `${url}.farmos.net`,
      },
      {
        headers: {
          accept: 'application/json',
          apikey: apiKey,
        },
        httpsAgent: agent,
      }
    );

    if (r.status === 200) {
      return true;
    } else {
      throw Error('unable to connect to aggregator');
    }
  } catch (error) {
    if (error && error.response && error.response.status && error.response.status === 400) {
      return false;
    }
    throw error;
  }
};

export default { isFarmosUrlAvailable, handle, testAggregatorConnection };
