/* eslint-disable no-unreachable */
import boom from '@hapi/boom';
import axios from 'axios';
import https from 'https';

import * as utils from '../helpers/surveys';

import { hasPermission } from './farmos/apiCompose';
import { aggregator } from './farmos/aggregator';
import { db } from '../db';

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

  const { deleteAllWithSurveystackId } = config();

  // console.log('deleting data', instanceName, id);
  const res = await deleteAllWithSurveystackId(instanceName, id);
  // console.log('done', res);
  if (!res.data) {
    return [];
  }
  return [res.data];
}

export const substitue = (entity, terms) => {
  if (entity && entity.relationships) {
    for (const bundle of Object.keys(entity.relationships)) {
      const innerDataArray = entity.relationships[bundle].data;
      for (const data of innerDataArray) {
        if (!data.id && data.type && data.name) {
          // candidate for replacement
          const [endpoint, bundle] = data.type.split('--');
          const replacement = terms.find(
            (term) =>
              term.endpoint === endpoint &&
              term.bundle == bundle &&
              term.name.toLowerCase() === data.name.toLowerCase()
          );

          if (replacement) {
            data.id = replacement.id;
            delete data.name;
          }
        }
      }
    }
  }
};

async function execute(aggregator, apiCompose, info, terms, user, submission) {
  // console.log('executing apiCompose', apiCompose);

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

  // substitute terms
  substitue(apiCompose.entity, terms);

  const payload = { data: apiCompose.entity };
  console.log('adding id to payload', submission._id);
  payload.data.attributes.surveystack_id = submission._id;

  return (await aggregator.create(url, endpoint, bundle, payload)).data;
}

export const getTerms = (apiCompose) => {
  const composeByUrl = {};
  const res = {};

  apiCompose.forEach((c) => {
    if (typeof c.url !== 'string') {
      throw boom.badData(`url is not a string: ${c.url}`);
    }

    if (!composeByUrl[c.url]) {
      composeByUrl[c.url] = [c];
      res[c.url] = [];
    } else {
      composeByUrl[c.url].push(c);
    }
  });

  for (const url of Object.keys(composeByUrl)) {
    const composeItems = composeByUrl[url];
    for (const compose of composeItems) {
      if (compose.entity && compose.entity.relationships) {
        for (const bundle of Object.keys(compose.entity.relationships)) {
          const innerDataArray = compose.entity.relationships[bundle].data;
          for (const data of innerDataArray) {
            if (!data.id && data.type && data.name) {
              const [endpoint, b] = data.type.split('--');

              let skip = false;
              for (const r of res[url]) {
                if (r.bundle === b && r.endpoint === endpoint && r.name === data.name) {
                  skip = true;
                  break;
                }
              }

              if (skip) {
                // already in there
                continue;
              }

              res[url].push({
                bundle: b,
                endpoint,
                name: data.name,
              });
            }
          }
        }
      }
    }
  }

  return res;
};

export const handle = async ({ submission, survey, user }) => {
  const surveyVersion = submission.meta.survey.version;

  // console.log('submission', JSON.stringify(submission, null, 2));

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

  const aggregator = config();

  const runSingle = async (apiCompose, info, terms) => {
    try {
      // console.log('running', apiCompose);
      const r = await execute(aggregator, apiCompose, info, terms, user, submission);

      if (Array.isArray(r)) {
        results.push(...r);
        return r;
      } else {
        results.push(r);
        return [r];
      }
    } catch (error) {
      console.log('error in run single', error);
      results.push({
        status: 'error',
        error,
      });
      return [];
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
      results.push(...res);
    }
  }
  const termStructures = getTerms(farmOsCompose);
  const instanceTerms = {};

  for (const url of Object.keys(termStructures)) {
    const terms = await aggregator.getAllTerms(url, termStructures[url]);
    instanceTerms[url] = terms;
  }

  for (const compose of farmOsCompose) {
    const info = {};

    const r = await runSingle(compose, info, instanceTerms[compose.url]);
    results.push(...r);
  }

  /** strip away compose from submission*/

  positions.forEach((position) => {
    const control = utils.getControl(controls, position);
    if (!control.options.apiCompose || !control.options.apiCompose.enabled) {
      return;
    }

    const field = utils.getSubmissionField(submission, survey, position);

    if (field.meta.relevant === false || !field.meta.apiCompose) {
      return;
    }
    delete field.meta.apiCompose;
  });

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

export const isFarmosUrlAvailable = async (url, apiKey) => {
  const agentOptions = {
    host: 'account.farmier.net',
    port: '443',
    path: '/',
    rejectUnauthorized: false,
  };

  const agent = new https.Agent(agentOptions);

  try {
    const r = await axios.post(
      `https://account.farmier.net/api/v1/utils/validate-farm-url`,
      {
        url,
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
    } else if (r.status === 400) {
      return false;
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

export const createInstance = async (
  url,
  email,
  site_name,
  registrant,
  location,
  units,
  tags,
  timezone,
  planName
) => {
  const apiKey = process.env.FARMOS_CREATE_KEY;
  if (!apiKey) {
    throw boom.badImplementation('farmos not configured');
  }

  const agentOptions = {
    host: 'account.farmier.net',
    port: '443',
    path: '/',
    rejectUnauthorized: false,
  };

  console.log('creat instance param: url', url);
  console.log('creat instance param: email', email);
  console.log('creat instance param: site_name', site_name);
  console.log('creat instance param: registrant', registrant);
  console.log('creat instance param: location', location);
  console.log('creat instance param: units', units);
  console.log('creat instance param: tags', tags);
  console.log('creat instance param: timezone', timezone);
  console.log('creat instance param: planName', planName);

  const agent = new https.Agent(agentOptions);
  const body = {
    url,
    email,
    site_name,
    registrant,
    location,
    units,
    plan: planName,
    tags,
    agree: true,
    timezone: timezone,
  };

  const r = await axios.post(`https://account.farmier.net/api/v1/farms`, body, {
    headers: {
      accept: 'application/json',
      apikey: apiKey,
      'Content-Type': 'application/json',
    },
    httpsAgent: agent,
  });
  return r;
};

export default { isFarmosUrlAvailable, handle, testAggregatorConnection };
