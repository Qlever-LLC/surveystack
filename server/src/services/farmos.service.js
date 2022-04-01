/* eslint-disable no-unreachable */
import boom from '@hapi/boom';
import axios from 'axios';
import https from 'https';

import * as utils from '../helpers/surveys';

import { hasPermission } from './farmos-2/apiCompose';
import { aggregator } from './farmos-2/aggregator';
import { db } from '../db';

const config = () => {
  if (!process.env.FARMOS_AGGREGATOR_URL || !process.env.FARMOS_AGGREGATOR_APIKEY) {
    console.log('env not set');
    return;
  }

  return aggregator(process.env.FARMOS_AGGREGATOR_URL, process.env.FARMOS_AGGREGATOR_APIKEY);
};

function allowed(farmUrl, user) {
  return hasPermission(user, farmUrl);
}

async function flushlogs(instanceName, user, id) {
  /**
   * TODO Group Admins should have access
   */
  if (!allowed(instanceName, user)) {
    throw boom.unauthorized('No Access to farm');
  }

  const { deleteAllWithData } = config();

  const res = await deleteAllWithData(instanceName, id);
  return res;
}

async function fetchTerms(farmUrl, credentials, user) {
  if (!allowed(farmUrl, user)) {
    throw boom.unauthorized('No Access to farm');
  }

  // TODO fetch terms
}

async function execute(apiCompose, info, terms, user, submission) {
  console.log('executing apiCompose', apiCompose);

  const url = apiCompose.url;
  const type = apiCompose.farmosType;

  if (!allowed(url, user)) {
    throw boom.unauthorized(`User has no access to farm: ${url}`);
  }

  // TODO
  // create log / assets / profile ....

  return [];
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

    console.log('apiCompose', field.meta);
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

  const runSingle = async (apiCompose, info, terms) => {
    try {
      const r = await execute(apiCompose, info, terms, user, submission);

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

  // TODO find for each instance relevant farm information

  const farmUrlMap = {};
  farmOsCompose.forEach((c) => {
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
