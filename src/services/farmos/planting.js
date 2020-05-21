import { aggregatorRequest } from './request';

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

async function asset(apiCompose, info, terms, user, credentials, submission) {
  const farmUrl = apiCompose.url;

  const cred = credentials.find((c) => c.url === farmUrl);
  if (!cred) {
    return;
  }

  const instanceId = submission._id;

  //console.log('vocab', info.info.resources.taxonomy_term.farm_crops.vid);
  // console.log('terms', terms);

  let assetId = null;
  const results = [];
  {
    const body = apiCompose.body;
    body.data = instanceId;

    const r = await createOrUpdate(farmUrl, cred, instanceId, 'assets', body);
    results.push(r[0]);
    assetId = r[0].id;

    if (!assetId) {
      throw Error(`asset ID not defined ${r}`);
    }
  }

  return results;
}

export { asset };
