/* eslint-disable no-unreachable */
import boom from '@hapi/boom';
import axios from 'axios';
import https from 'https';

import * as utils from '../helpers/surveys';
import { asset } from './farmos/planting';
import { log } from './farmos/log';
import { area } from './farmos/area';
import { aggregatorRequest } from './farmos/request';
import { farminfo } from './farmos/farminfo';

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

async function flushlogs(farmUrl, credentials, user, id) {
  if (!allowed(farmUrl, user)) {
    throw boom.unauthorized('No Access to farm');
  }

  const cred = credentials.find((c) => c.url === farmUrl);
  if (!cred) {
    return [];
  }

  const results = [];
  const logs = await aggregatorRequest(
    cred.aggregatorURL,
    cred.aggregatorApiKey,
    farmUrl,
    'logs',
    'get',
    undefined,
    id
  );

  console.log('res from logs operation', logs);

  if (logs.length === 0) {
    return results;
  }

  console.log('logs response', logs);

  const query = logs.map((l) => `id=${l.id}`).join('&');

  console.log('query string: ' + query);

  const r = await aggregatorRequest(
    cred.aggregatorURL,
    cred.aggregatorApiKey,
    farmUrl,
    'logs',
    'delete',
    undefined,
    undefined,
    undefined,
    query
  );

  console.log('res[0] from delete operation', JSON.stringify(r));

  // response format
  // [{"1406":[]}]

  // TODO how to catch errors here?
  // results.push(r);
  return results;
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

async function execute(apiCompose, info, terms, user, submission, currentAssetId, currentAreaId) {
  const url = apiCompose.url;
  const type = apiCompose.farmosType;

  if (!allowed(url, user)) {
    throw boom.unauthorized(`User has no access to farm: ${url}`);
  }

  const credentials = await getCredentials(user);

  if (type === 'asset') {
    console.log("running farmos asset");
    return await asset(apiCompose, info, terms, user, credentials, submission, currentAreaId);
  } else if (type === 'area') {
    console.log("running farmos area");
    return await area(apiCompose, info, terms, user, credentials, submission);
  } else if (type === 'log') {
    console.log("running farmos log");
    return await log(apiCompose, info, terms, user, credentials, submission, currentAssetId, currentAreaId);
    // TODO create log
    // TODO check all terms, create if not existing
    // TODO replace terms in body
  }
}

export const handle = async ({ submission, survey, user }) => {
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

  console.log('farmOsCompose', farmOsCompose);
  if (farmOsCompose.length === 0) {
    return [];
  }

  const results = [];

  const runSingle = async (apiCompose, info, terms, currentAssetId, currentAreaId) => {
    try {
      const r = await execute(apiCompose, info, terms, user, submission, currentAssetId, currentAreaId);
      
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
      console.log('error in run single', error.message);
      results.push({
        status: 'error',
        error,
      });
      return null;
    }
  };

  // distinct aggregator map
  const aggregators = new Map();
  const credentials = await getCredentials(user);

  credentials.forEach((credential) => {
    aggregators.set(credential.aggregatorURL, credential.aggregatorApiKey);
  });

  let info = [];
  try {
    // FML: note that one can not use forEach with await
    for (const [url, apiKey] of aggregators.entries()) {
      const { data } = await farminfo(url, apiKey);
      info.push(...data);
    }
  } catch (error) {
    console.log('error fetching farm info from aggregator');
    throw error;
  }

  console.log('compose', farmOsCompose);

  const farmUrlMap = {};
  farmOsCompose.forEach((c) => {
    const items = farmUrlMap[c.url];
    farmUrlMap[c.url] = items === undefined ? 1 : items + 1;
  });
  for (const farmUrl of Object.keys(farmUrlMap)) {
    const res = await flushlogs(farmUrl, credentials, user, submission._id);
    if (res.length > 0) {
      results.push(res);
    }
  }

  // TODO, for all farms flush logs with data == submissionId
  // flushlogs()

  let currentAssetId = null;
  let currentAreaId = null;
  for (const compose of farmOsCompose) {
    const r = await runSingle(
      compose,
      info.find((farm) => farm.url === compose.url),
      {},
      currentAssetId,
      currentAreaId
    );

    if (r) {
      r.forEach((item) => {
        if (!item) {
          return;
        }

        if (item.resource === 'farm_asset') {
          console.log('using asset id', item.id);
          currentAssetId = item.id;
        }

        if(compose.farmosType === 'area') {
          console.log('using area id', item.id);
          currentAreaId = item.id;  
        }
      });
    }
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

  const r = await axios.get(`https://${url}/api/v1/farms/`, {
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

export default { isFarmosUrlAvailable, handle, getCredentials, testAggregatorConnection };
