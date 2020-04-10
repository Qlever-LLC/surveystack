import moment from 'moment';
import { aggregatorRequest } from './request';

function plantingBody(name, cropId, instanceId) {
  return {
    name,
    type: 'planting',
    crop: [
      {
        id: cropId,
      },
    ],
    data: instanceId,
  };
}

function log(type, cropName, fieldId, assetId, timestamp, instanceId) {
  return {
    name: cropName,
    movement: {
      area: [
        {
          id: fieldId,
        },
      ],
    },
    asset: [{ id: assetId }],
    type,
    timestamp,
    done: 1,
    data: instanceId,
  };
}

async function createOrUpdate(farmUrl, cred, instanceId, endpoint, body) {
  const checkExisting = await aggregatorRequest(
    cred.aggregatorURL,
    cred.aggregatorApiKey,
    farmUrl,
    endpoint,
    'get',
    undefined,
    instanceId
  );

  let id = null;
  if (checkExisting.length !== 0) {
    id = checkExisting[0].id; // TODO should probably check if there are several
  }

  let r;
  if (id === null) {
    r = await aggregatorRequest(
      cred.aggregatorURL,
      cred.aggregatorApiKey,
      farmUrl,
      endpoint,
      'post',
      body
    );
  } else {
    // update the planting
    Object.assign(body, { id });
    r = await aggregatorRequest(
      cred.aggregatorURL,
      cred.aggregatorApiKey,
      farmUrl,
      endpoint,
      'put',
      body
    );
  }

  return r;
}

async function planting(apiCompose, info, terms, user, credentials, submission) {
  const farmUrl = apiCompose.url;

  const cred = credentials.find((c) => c.url === farmUrl);
  if (!cred) {
    return;
  }

  const crop = apiCompose.body.crop;
  const field = apiCompose.body.area;
  const date = apiCompose.body.date;
  const instanceId = submission._id;

  const vocabId = info.info.resources.taxonomy_term.farm_crops.vid;
  const cropTypes = terms.filter((term) => term.vocabulary.id === vocabId);
  // const farm = farms.find(farm => farm.url === farmUrl);

  let farmOsCrop = cropTypes.find((c) => c.name.toLowerCase() === crop);
  const results = [];

  if (!farmOsCrop) {
    const body = {
      vocabulary: parseInt(vocabId),
      name: crop,
    };

    const r = await aggregatorRequest(
      cred.aggregatorURL,
      cred.aggregatorApiKey,
      farmUrl,
      'terms',
      'post',
      body
    );

    farmOsCrop = {
      name: crop,
      vocabulary: {
        id: vocabId,
      },
      tid: r[0].id,
    };
    terms.push(farmOsCrop);
    results.push(r);
  }
  //console.log('vocab', info.info.resources.taxonomy_term.farm_crops.vid);
  // console.log('terms', terms);

  let plantingId = null;
  {
    const body = plantingBody(
      apiCompose.body.name || `${crop} Planting`,
      farmOsCrop.tid,
      instanceId
    );
    const r = await createOrUpdate(farmUrl, cred, instanceId, 'assets', body);
    results.push(r[0]);
    plantingId = r[0].id;

    if (!plantingId) {
      throw Error(`Planting ID not defined ${r}`);
    }
  }

  {
    const tmp = apiCompose.body.method || 'seeding';
    const method = tmp === 'seeding' ? 'farm_seeding' : 'farm_transplanting';
    const timestamp = date ? moment(date).unix() : moment().unix();

    const body = log(
      method,
      `${tmp} for ${crop}`,
      parseInt(field),
      parseInt(plantingId),
      parseInt(timestamp),
      instanceId
    );

    const r = await createOrUpdate(farmUrl, cred, instanceId, 'logs', body);
    results.push(r[0]);
  }

  return results;
}

export { planting };
