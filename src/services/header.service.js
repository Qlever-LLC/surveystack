import { ObjectId } from 'mongodb';
import TreeModel from 'tree-model';
import { flatten } from 'flat';

import { db } from '../db';

function stringifyObjectIds(obj) {
  if (!obj) {
    return;
  }
  for (const prop of Object.keys(obj)) {
    switch (typeof obj[prop]) {
      case 'object':
        if (obj[prop] && obj[prop]._bsontype === 'ObjectID') {
          obj[prop] = obj[prop].toString();
        } else {
          stringifyObjectIds(obj[prop]);
        }
        break;
      default:
        break;
    }
  }
}

const getHeaders = async (id) => {
  const survey = await db.collection('surveys').findOne({ _id: new ObjectId(id) });
  if (!survey) {
    return null;
  }

  const { controls } = survey.revisions[survey.revisions.length - 1];

  const tree = new TreeModel();
  const root = tree.parse({ name: 'data', children: controls });

  const surveyHeaders = {};

  // assign first node
  root.walk((node) => {
    const header = node
      .getPath()
      .map((n) => n.model.name)
      .join('.');
    if (node.model.type === 'group' || node.model.type === 'page') {
      surveyHeaders[`${header}.meta`] = [];
      return;
    }
    surveyHeaders[`${header}.meta`] = [];
    surveyHeaders[`${header}.value`] = [];
  });

  delete surveyHeaders['data'];
  delete surveyHeaders['data.meta'];

  const entities = await db
    .collection('submissions')
    .find({ 'meta.survey.id': ObjectId(id) })
    .toArray();

  let mergedObject = {};

  entities.forEach((entity) => {
    stringifyObjectIds(entity);
    const flatEntityData = flatten({ data: entity.data });
    mergedObject = { ...mergedObject, ...flatEntityData };
  });

  const submissionHeaders = Object.keys(mergedObject);

  for (const header of Object.keys(surveyHeaders)) {
    const match = submissionHeaders.filter((sh) => sh.startsWith(header));

    if (match.length > 0) {
      surveyHeaders[header].push(...match);
      for (const m of match) {
        const i = submissionHeaders.indexOf(m);

        if (i >= 0) {
          console.log('splicing ', m);
          submissionHeaders.splice(i, 1);
        }
      }
    }
  }

  const headers = [];
  for (const k of Object.keys(surveyHeaders)) {
    headers.push(...surveyHeaders[k]);
  }

  // any possible remaining headers - but submissionHeaders should be cleared by now
  headers.push(...submissionHeaders);

  return { headers, surveyHeaders, submissionHeaders };
};

export default {
  getHeaders,
};
