import * as utils from '../helpers/surveys';
import { planting } from './farmos/planting';
import { aggregatorRequest } from './farmos/request';
import { farminfo } from './farmos/farminfo';
import boom from '@hapi/boom';

import { db } from '../db';

/*
const credentials = [
  {
    name: 'farmOS Test',
    url: 'test.farmos.net',
    aggregatorURL: 'oursci.farmos.group',
    aggregatorApiKey: process.env.FARMOS_AGGREGATOR_APIKEY,
  },
  {
    name: 'Our Sci Test	',
    url: 'ourscitest.farmos.net',
    aggregatorURL: 'oursci.farmos.group',
    aggregatorApiKey: process.env.FARMOS_AGGREGATOR_APIKEY,
  },
];
*/

export const getCredentials = async (user) => {
  if (!user) {
    throw boom.unauthorized(`You are not logged in.`);
  }

  const filter = { type: 'farmos-farm' };

  const memberships = await db
    .collection('memberships')
    .find({ user: user._id })
    .project({ _id: 1 })
    .toArray();
  filter.membership = { $in: memberships.map((m) => m._id) };

  const entities = await db
    .collection('integrations.memberships')
    .aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'integrations.groups',
          localField: 'data.aggregator',
          foreignField: '_id',
          as: 'aggregatorDetails',
        },
      },
      {
        $unwind: '$aggregatorDetails',
      },
      {
        $project: {
          name: '$name',
          url: '$data.url',
          aggregatorURL: '$aggregatorDetails.data.url',
          aggregatorApiKey: '$aggregatorDetails.data.apiKey',
          farmId: '$data.farm',
        },
      },
    ])
    .toArray();
  return entities;
};

function allowed(farmUrl, user) {
  // TODO: has user access to farm URL in one of the Aggregators?
  // TODO: also figure out aggregator
  return true;
}

async function flushlogs(farmUrl, user, submission) {
  //  TODO
}

async function fetchTerms(farmUrl, credentials, user) {
  if (!allowed(farmUrl, user)) {
    throw boom.unauthorized('No Access to farm');
  }

  const cred = credentials.find((c) => c.url === farmUrl);
  if (!cred) {
    return;
  }

  return await aggregatorRequest(
    cred.aggregatorURL,
    cred.aggregatorApiKey,
    farmUrl,
    'terms',
    'get'
  );
}

async function execute(apiCompose, info, terms, user, submission) {
  const url = apiCompose.body.url;
  const type = apiCompose.body.type;

  if (!allowed(url, user)) {
    throw boom.unauthorized(`User has no access to farm: ${url}`);
  }

  const credentials = await getCredentials(user);

  if (type === 'planting') {
    return await planting(apiCompose, info, terms, user, credentials, submission);
  }
}

export const handle = async (res, submission, survey, user) => {
  const credentials = await getCredentials(user);

  const surveyVersion = submission.meta.survey.version;

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

  const results = [];

  const runSingle = async (apiCompose, info, terms) => {
    try {
      const r = await execute(apiCompose, info, terms, user, submission);
      if (Array.isArray(r)) {
        results.push(...r);
      } else {
        results.push(r);
      }
    } catch (error) {
      console.log('error in run single', error);
      results.push({
        status: 'error',
        error,
      });
    }
  };

  let info = [];
  try {
    info = (await farminfo('oursci.farmos.group', process.env.FARMOS_AGGREGATOR_APIKEY)).data;
  } catch (error) {
    console.log('error fetching farm info from aggregator');
    throw error;
  }

  const farmUrls = farmOsCompose
    .map((c) => {
      if (c.body !== undefined && typeof c.body === 'object') {
        return c.body.farmUrl;
      }
      return null;
    })
    .filter((u) => u !== null);

  const distinctFarms = farmUrls.filter((u, pos) => farmUrls.indexOf(u) === pos);

  const termMap = {};
  for (const f of distinctFarms) {
    const terms = await fetchTerms(f, credentials, user);
    termMap[f] = terms;
  }

  for (const compose of farmOsCompose) {
    await runSingle(
      compose,
      info.find((farm) => farm.url === compose.body.farmUrl),
      termMap[compose.body.farmUrl]
    );
  }

  console.log('results', results);
  return results;
};

export default { handle, getCredentials };
