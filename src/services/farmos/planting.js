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
    data: JSON.stringify({
      instanceId,
    }),
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
    data: JSON.stringify({
      instanceId,
    }),
  };
}

async function planting(apiCompose, info, terms, user, credentials, submission) {
  const { farmUrl } = apiCompose.body;

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
    const r = await aggregatorRequest(
      cred.aggregatorURL,
      cred.aggregatorApiKey,
      farmUrl,
      'assets',
      'post',
      body
    );

    results.push(r);
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

    const r = await aggregatorRequest(
      cred.aggregatorURL,
      cred.aggregatorApiKey,
      farmUrl,
      'logs',
      'post',
      body
    );

    results.push(r);
  }

  return results;
}

export { planting };
