import { aggregatorRequest } from './request';

async function create(farmUrl, cred, instanceId, endpoint, body) {
  const r = await aggregatorRequest(
    cred.aggregatorURL,
    cred.aggregatorApiKey,
    farmUrl,
    endpoint,
    'post',
    body
  );

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

    const r = await create(farmUrl, cred, instanceId, 'assets', body);
    results.push(r[0]);
    assetId = r[0].id;

    if (!assetId) {
      throw Error(`asset ID not defined ${r}`);
    }
  }

  return results;
}

export { asset };
