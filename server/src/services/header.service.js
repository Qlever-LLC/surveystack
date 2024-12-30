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

function arrayMax(arr) {
  var len = arr.length,
    max = 0;
  while (len--) {
    if (arr[len] > max) {
      max = arr[len];
    }
  }
  return max;
}

// Lists the headers that exist both in the submissions and the selected version of survey.
// It tries to select the latest survey version used by the submission. If that fails it uses the latest survey version.
export const getHeaders = async (
  surveyId,
  entities,
  options = {
    excludeDataMeta: false,
    // Set to true, when the questions in the entities don't have the `value` intermediary filed (ie. `{number_1: 1}` instead of `{number_1: { value: 1}}`)
    questionsHaveNoValueField: false,
  }
) => {
  if (!surveyId) {
    return [];
  }

  const survey = await db.collection('surveys').findOne({ _id: new ObjectId(surveyId) });
  if (!survey) {
    return [];
  }

  let version = survey.latestVersion;
  try {
    const maxSurveyVersionFromEntities = arrayMax(entities.map((e) => e.meta.survey.version));
    if (maxSurveyVersionFromEntities > 0) {
      version = maxSurveyVersionFromEntities;
    } else {
      throw new Error();
    }
  } catch (error) {
    console.log(`could not determine max survey version from entities, using version ${version}`);
  }

  // Get controls for survey version, fallback to empty controls if survey version no longer exists.
  // Survey version may have been removed by cleanup tool.
  const { controls } = survey.revisions.find((r) => r.version === version) ?? { controls: [] };

  const tree = new TreeModel();
  const root = tree.parse({ name: 'data', children: controls });

  const surveyHeaders = { _id: [], meta: [] };

  root.walk((node) => {
    const header = node
      .getPath()
      .map((n) => n.model.name)
      .join('.');
    if (node.model.type === 'group' || node.model.type === 'page') {
      return;
    }
    if (options.questionsHaveNoValueField) {
      surveyHeaders[header] = [];
    } else {
      surveyHeaders[`${header}.value`] = [];
    }
  });

  delete surveyHeaders['data.value'];
  delete surveyHeaders['data'];

  let mergedObject = { _id: null };

  entities.forEach((entity) => {
    stringifyObjectIds(entity);
    mergedObject = { ...mergedObject, ...flatten(entity) };
  });

  const submissionHeaders = Object.keys(mergedObject);

  for (const header of Object.keys(surveyHeaders)) {
    const match = submissionHeaders.filter((sh) => sh.startsWith(header));

    if (match.length > 0) {
      surveyHeaders[header].push(...match);
      for (const m of match) {
        const i = submissionHeaders.indexOf(m);

        if (i >= 0) {
          submissionHeaders.splice(i, 1); // remove from submissionHeaders
        }
      }
    }
  }

  const headers = [];
  for (const k of Object.keys(surveyHeaders)) {
    if (k === 'meta') {
      headers.push(...surveyHeaders[k]);
    } else {
      headers.push(...surveyHeaders[k].sort());
    }
  }

  // any possible remaining headers - ideally submissionHeaders should be cleared by now
  headers.push(...submissionHeaders);

  if (options.excludeDataMeta) {
    const headersWithoutDataMeta = headers.filter((h) => {
      // exclude any headers starting with data and including 'meta'
      if (h.startsWith('data') && (h.includes('.meta.') || h.endsWith('.meta'))) {
        return false;
      }
      return true;
    });
    return headersWithoutDataMeta;
  }

  return headers;
};

export default {
  getHeaders,
};
