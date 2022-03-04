import { aggregatorRequest } from './request';
import wkx from 'wkx';

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

async function getInfo(farmUrl, cred) {
  const r = await aggregatorRequest(
    cred.aggregatorURL,
    cred.aggregatorApiKey,
    farmUrl,
    'info',
    'get',
    '',
    null,
    null,
    'use_cached=false'
  );

  return r;
}

async function area(apiCompose, info, terms, user, credentials, submission) {
  const farmUrl = apiCompose.url;

  const cred = credentials.find((c) => c.url === farmUrl);
  if (!cred) {
    return;
  }

  let wkt = '';
  wkt = wkx.Geometry.parseGeoJSON(apiCompose.body.boundries.features[0].geometry).toWkt();

  const instanceId = submission._id;

  //console.log('vocab', info.info.resources.taxonomy_term.farm_crops.vid);
  // console.log('terms', terms);

  const infoResponse = await getInfo(farmUrl, cred);
  const vid = infoResponse['info']['resources']['taxonomy_term']['farm_areas'].vid;
  console.log('using vid', vid);

  const body = {
    vocabulary: vid + '',
    name: apiCompose.body.name,
    description: '',
    area_type: 'field',
    geofield: [
      {
        geom: wkt,
      },
    ],
  };

  let areaId = null;
  const results = [];
  {
    // body.data = instanceId;

    const r = await create(farmUrl, cred, instanceId, 'areas', body);
    results.push(r[0]);
    areaId = r[0].id;

    if (!areaId) {
      throw Error(`areaId ID not defined ${r}`);
    }
  }

  return results;
}

export { area };
