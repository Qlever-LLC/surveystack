import axios from 'axios';
import https from 'https';
import * as utils from '../helpers/surveys';

const farms = [
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

function allowed(farmUrl, user) {
  // TODO: has user access to farm URL in one of the Aggregators?
  // TODO: also figure out aggregator
  return true;
}

async function farminfo(aggregatorURL, aggregatorKey) {
  const agentOptions = {
    host: aggregatorURL,
    port: '443',
    path: '/',
    rejectUnauthorized: false,
  };

  const agent = new https.Agent(agentOptions);

  const r = await axios.get(`https://${aggregatorURL}/api/v1/farms/info/?use_cached=true`, {
    headers: {
      accept: 'application/json',
      'api-key': aggregatorKey,
    },
    httpsAgent: agent,
  });

  return r;
}

async function getRequest(aggregatorURL, aggregatorKey, farmUrl, endpoint) {
  const agentOptions = {
    host: aggregatorURL,
    port: '443',
    path: '/',
    rejectUnauthorized: false,
  };

  const agent = new https.Agent(agentOptions);

  const r = await axios.get(
    `https://${aggregatorURL}/api/v1/farms/${endpoint}/?farm_url=${encodeURIComponent(farmUrl)}`,
    {
      headers: {
        accept: 'application/json',
        'api-key': aggregatorKey,
      },
      httpsAgent: agent,
    }
  );

  const farmId = Object.keys(r)[0];
  return r[farmId];
}

async function planting(farmUrl, info, apiCompose, submission) {
  const farm = farms.find(farm => farm.url === farmUrl);
  const id=

  const termsResponse = await getRequest(
    farm.aggregatorURL,
    farm.aggregatorApiKey,
    farmUrl,
    'terms'
  );
}

async function log(aggregator, farmUrl, apiCompose, submission) {
  // TODO
}

async function execute(apiCompose, info, user, submission) {
  const { farmUrl, type } = apiCompose;
  if (!allowed(farmUrl, user)) {
    throw Error('No Access to farm');
  }

  if (type === 'planting') {
    planting(farmUrl, info, apiCompose, submission);
  }
}

const handle = async (res, submission, survey, user) => {
  const surveyVersion = submission.meta.survey.version;

  const { controls } = survey.revisions.find(revision => revision.version === surveyVersion);
  const positions = utils.getControlPositions(controls);

  const fields = [];
  positions.forEach(position => {
    const control = utils.getControl(controls, position);
    if (!control.options.apiCompose || !control.options.apiCompose.enabled) {
      return;
    }

    const field = utils.getSubmissionField(submission, survey, position);
    if (!field.meta.apiCompose) {
      console.log('missing api compose');
      return;
    }

    if (!field.meta.apiCompose.type || field.meta.apiCompose.type !== 'farmos') {
      // only handle farmos
      return;
    }
    fields.push(field);
  });

  const results = [];

  const runSingle = async (apiCompose, info) => {
    try {
      const r = await execute(apiCompose, info, user, submission);
      results.push(r);
    } catch (error) {
      results.push({
        status: 'error',
        error,
      });
    }
  };

  let info = [];
  try {
    info = farminfo('oursci.farmos.group', process.env.FARMOS_AGGREGATOR_APIKEY);
  } catch (error) {
    console.log('error fetching farm info from aggregator');
  }

  const farmUrls = [];

  for (const field of fields) {
    const obj = field.meta.apiCompose;
    if (Array.isArray(obj)) {
      for (const apiCompose of obj) {
        farmUrls.push(apiCompose.body.farmUrl);
      }
    } else {
      farmUrls.push(obj.body.farmUrl);
    }
  }

  for (const field of fields) {
    const obj = field.meta.apiCompose;
    if (Array.isArray(obj)) {
      for (const apiCompose of obj) {
        await runSingle(
          apiCompose,
          info.find(farm => farm.url === obj.body.farmUrl)
        );
      }
    } else {
      await runSingle(
        obj,
        info.find(farm => farm.url === obj.body.farmUrl)
      );
    }
  }

  return results;
};

export { handle };
