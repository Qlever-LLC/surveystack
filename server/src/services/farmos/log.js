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
  currentAssetId,
  currentAreaId
) {
  const results = [];
  const farmUrl = apiCompose.url;

  console.log('credentials', credentials);
  const cred = credentials.find((c) => c.url === farmUrl);
  if (!cred) {
    console.log('credentials missing', farmUrl);
    return;
  }

  const terms = apiCompose.terms;
  const termMap = {};
  if (terms) {
    for (const t of terms) {
      console.log('ensuring terms');
      const id = await ensureTerm(t.name, t.machine, info, availableTerms, farmUrl, cred);
      console.log('term', t);
      console.log('id', id);
      termMap[t.sym] = id;
    }
  }

  const date = apiCompose.body.date;
  const instanceId = submission._id;
  if (!apiCompose.body.timestamp && date) {
    const timestamp = date ? moment(date).unix() : moment().unix();
    apiCompose.body.timestamp = timestamp;
    delete apiCompose.body.date;
  }

  // replace archived timestamp with unix
  const archived = apiCompose.body.archived;
  if (archived) {
    const tmp = moment(archived).unix();
    apiCompose.body.archived = tmp;
  }

  apiCompose.body.data = instanceId;

  let bodyString = JSON.stringify(apiCompose.body, null, 4);
  console.log('stringified body', bodyString);

  Object.keys(termMap).forEach((sym) => {
    const id = termMap[sym];
    bodyString = bodyString.replace(sym, id);
  });

  if (currentAssetId) {
    bodyString = bodyString.replace('$ASSET', currentAssetId);
  }

  if (currentAreaId) {
    bodyString = bodyString.replace('$AREA', currentAreaId);
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

    const response = r[0];
    if (response === null) {
      results.push({
        status: 'error',
        error: {
          message: apiCompose.body.name,
          config: {
            data: 'farmos returned *null*',
          },
        },
      });
    } else {
      results.push(response);
    }
  }

  return results;
}

export { log };
