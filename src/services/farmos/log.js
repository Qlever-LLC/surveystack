import moment from 'moment';
import { aggregatorRequest } from './request';

async function ensureTerm(name, machine, info, availableTerms, farmUrl, cred) {
  const vocabId = info.info.resources.taxonomy_term[machine].vid;
  console.log('vocab id is', vocabId);
  if (!vocabId) {
    throw new Error('Vocabulary for machine not found: ' + machine);
  }
  const terms = availableTerms.filter((t) => t.vocabulary.id === vocabId);
  // const farm = farms.find(farm => farm.url === farmUrl);

  console.log('searching in terms for', name, terms);
  let t = terms.find((c) => c.name.toLowerCase() === name.toLowerCase());

  if (!t) {
    const body = {
      vocabulary: parseInt(vocabId),
      name,
    };

    const r = await aggregatorRequest(
      cred.aggregatorURL,
      cred.aggregatorApiKey,
      farmUrl,
      'terms',
      'post',
      body
    );

    t = {
      name,
      vocabulary: {
        id: vocabId,
      },
      tid: r[0].id,
    };
    availableTerms.push(t);
    return r[0].id;
  } else {
    return t.tid;
  }
}


async function log(
  apiCompose,
  info,
  availableTerms,
  user,
  credentials,
  submission,
  currentAssetId
) {
  const results = [];
  const farmUrl = apiCompose.url;

  const cred = credentials.find((c) => c.url === farmUrl);
  if (!cred) {
    return;
  }

  const { terms } = apiCompose;
  const termMap = {};
  for (const t of terms) {
    const id = await ensureTerm(t.name, t.machine, info, availableTerms, farmUrl, cred);
    console.log('term', t);
    console.log('id', id);
    termMap[t.sym] = id;
  }

  const date = apiCompose.body.date;
  const instanceId = submission._id;
  const timestamp = date ? moment(date).unix() : moment().unix();

  delete apiCompose.body.date;
  apiCompose.body.timestamp = timestamp;
  apiCompose.body.data = instanceId;

  let bodyString = JSON.stringify(apiCompose.body, null, 4);
  console.log('stringified body', bodyString);

  Object.keys(termMap).forEach((sym) => {
    const id = termMap[sym];
    bodyString = bodyString.replace(sym, id);
  });

  if (currentAssetId) {
    bodyString = bodyString.replace('$PLANTING', currentAssetId);
  }

  console.log('substituted string', bodyString);

  {
    const r = await aggregatorRequest(
      cred.aggregatorURL,
      cred.aggregatorApiKey,
      farmUrl,
      'logs',
      'post',
      JSON.parse(bodyString)
    );
    results.push(r[0]);
  }

  return results;
}

export { log };
