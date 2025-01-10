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

const getControlsBasedOnSurveyVersions = (revisions, version) => {
  const { controls } = revisions.find((r) => r.version === version) ?? {
    controls: [],
  };
  const tree = new TreeModel();
  const root = tree.parse({ name: 'data', children: controls });
  return root;
};

// for a given path to a question in this survey, returns infos object
const getAdditionalExportInfos = (survey, path) => {
  const parts = path.split('.');
  const infos = {
    label: undefined,
    hint: undefined,
    value: undefined,
    spreadsheetLabel: undefined,
  };
  let children = survey.children;

  const checkName = (block) => (block.model ? block.model.name : block.name);
  const checkType = (block) => (block.model ? block.model.type : block.type);

  const getLabel = (block) => (block.model ? block.model.label : block.label);
  const getHint = (block) => (block.model ? block.model.hint : block.hint);

  const searchChildren = (children) => {
    for (const el of children) {
      if (parts.includes(checkName(el))) {
        if (checkType(el) === 'matrix') {
          infos.label = getLabel(el);
          infos.hint = getHint(el);

          let child = el.model ? el.model.options.source.content : el.options.source.content;
          child.forEach((ch) => {
            const value = ch.model ? ch.model.value : ch.value;

            if (parts.includes(value)) {
              infos.value = value;
              infos.spreadsheetLabel = ch.model ? ch.model.spreadsheetLabel : ch.spreadsheetLabel;
            }
          });
        } else if (checkType(el) === 'group' || checkType(el) === 'page') {
          const children = el.model ? el.model.children : el.children;
          return searchChildren(children);
        } else {
          infos.label = getLabel(el);
          infos.hint = getHint(el);
          infos.value = el.model ? el.model.name : el.name;
        }
      }
    }
  };

  searchChildren(children);

  infos.label = escapeCsvDelimiterValue(infos.label);
  infos.hint = escapeCsvDelimiterValue(infos.hint);
  infos.value = escapeCsvDelimiterValue(infos.value);
  infos.spreadsheetLabel = escapeCsvDelimiterValue(infos.spreadsheetLabel);

  return infos;
};

const escapeCsvDelimiterValue = (value) => {
  if (
    typeof value === 'string' &&
    (value.includes(',') || value.includes(';') || value.includes('"'))
  ) {
    // Escape double quotes by replacing them with two double quotes
    value = value.replace(/"/g, '""');
    // Add double quotes around the value
    return `"${value}"`;
  }
  return value;
};

// Lists the headers that exist both in the submissions and the selected version of survey.
// It tries to select the latest survey version used by the submission. If that fails it uses the latest survey version.
const getHeaders = async (
  surveyId,
  entities,
  options = { excludeDataMeta: false, splitValueFieldFromQuestions: false, csvExport: false }
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
    if (options.splitValueFieldFromQuestions) {
      surveyHeaders[header] = [];
    } else {
      surveyHeaders[`${header}.value`] = [];
    }
  });

  delete surveyHeaders['data.value'];
  delete surveyHeaders['data'];

  let mergedObject = { _id: null };

  const headersVersion = [];

  entities.forEach((entity) => {
    stringifyObjectIds(entity);
    mergedObject = { ...mergedObject, ...flatten(entity) };
    delete mergedObject.version;
    if (options.csvExport) {
      Object.keys(mergedObject).forEach((param) => {
        if (!headersVersion[param] || headersVersion[param] < entity.version) {
          headersVersion[param] = entity.version;
        }
      });
    }
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

  const additionalInfos = [];
  if (options.csvExport) {
    headers.forEach((h) => {
      if (
        !(
          h.startsWith('_id') ||
          (h.startsWith('data') && (h.includes('.meta.') || h.endsWith('.meta')))
        )
      ) {
        const localRoot = getControlsBasedOnSurveyVersions(survey.revisions, headersVersion[h]);
        const result = getAdditionalExportInfos(localRoot, h);
        additionalInfos.push({ headers: h, ...result });
      }
    });
  }

  return { headers, additionalInfos };
};

export default {
  getHeaders,
};
