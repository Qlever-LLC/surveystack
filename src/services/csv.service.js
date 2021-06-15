/* eslint no-restricted-syntax: 0 */
/* eslint no-param-reassign: 0 */
import papa from 'papaparse';
import _ from 'lodash';
import { flatten } from 'flat';
import { ObjectId } from 'mongodb';

function removeKeys(obj, keys) {
  if (!obj) {
    return;
  }
  for (const prop of Object.keys(obj)) {
    switch (typeof obj[prop]) {
      case 'object':
        if (keys.indexOf(prop) > -1) {
          delete obj[prop];
        } else {
          removeKeys(obj[prop], keys);
        }
        break;
      default:
        if (keys.indexOf(prop) > -1) {
          delete obj[prop];
        }
        break;
    }
  }
}

//
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

/**
 *
 * @param {*} o submission question object e.g. { meta: { type: 'geoJSON', ...}, value: {...}}
 * @returns updated submission question object
 */
 export function geojsonTransformer(o) {
  return {
    ...o,
    value: {
      ...o.value,
      features: o.value.features.map(JSON.stringify),
    },
  };
}

/**
 * transform submission object for presentation in csv
 * @param {*} obj: submission object to transform
 * @param {{[string]: function}} typeHandlers: object with keys for question types to match
 * and values of transform functions to apply to those question types. Transform functions
 * should return the updated value for the question value
 * @returns updated submission object
 */
 export function transformSubmissionQuestionTypes(obj, typeHandlers) {
  return Object.entries(obj).map(([key, val]) => {
    if (typeof val === 'object' && val !== null) {
      const typeHandler = 'meta' in obj[key]
        && obj[key].meta.type in typeHandlers
        && typeHandlers[obj[key].meta.type];
      if (typeHandler) {
        return { [key]: typeHandler(val) };
      }
      return { [key]: transformSubmissionQuestionTypes(val, typeHandlers) };
    }
    return { [key]: val };
  }) // Flatten objects
    .reduce((r, x) => ({ ...r, ...x }), {});
}

function createHeaders(mergedObject, entities, options = { excludeDataMeta: false }) {
  stringifyObjectIds(mergedObject);

  let merged = flatten(mergedObject);
  entities.forEach((entity) => {
    stringifyObjectIds(entity);
    const flatEntityData = flatten({ data: entity.data });
    merged = { ...merged, ...flatEntityData };
  });

  const headers = Object.keys(merged);
  if (options.excludeDataMeta) {
    const filtered = headers.filter((h) => !h.includes('.meta'));
    return filtered;
  }

  return headers;
}

function createCsvLegacy(submissions) {
  const items = [];
  submissions.forEach((s) => {
    const submission = _.cloneDeep(s);
    submission._id = submission._id.toString();
    if (submission.survey) {
      submission.survey = submission.survey.toString();
    }

    removeKeys(submission.data, ['meta']);

    items.push(flatten(submission));
  });

  // Finding a suitable header row is not trivial at all,
  // because we don't really know what to expect in the submissions.
  // For now we just use the submission with the most keys/columns
  let maxCols = 0;
  let maxColsIndex = 0;
  items.forEach((item, index) => {
    const numColumns = Object.keys(item).length;
    if (numColumns > maxCols) {
      maxCols = numColumns;
      maxColsIndex = index;
    }
  });

  let columns = null;
  if (maxCols > 0) {
    columns = Object.keys(items[maxColsIndex]);
  }

  // With implicit header row
  // (keys of first object populate header row)
  // TODO: add all headers from all submissions
  // https://www.papaparse.com/docs
  const csv = papa.unparse(items, {
    columns,
  });

  return csv;
}

function createCsv(submissions, headers) {
  const items = [];
  submissions.forEach((ss) => {
    const submission = _.cloneDeep(ss);

    // when flattening a submission, special BSON types such as ObjectId are flattened into
    // {_bsontype: 'ObjectID', id: <Buffer ...>}
    // This is to make sure ObjectIds are stringified for CSV output
    stringifyObjectIds(submission);

    // removeKeys(submission.data, ['meta']); // remove meta fields below data
    items.push(flatten(submission));
  });

  let csv = '';
  try {
    csv = papa.unparse(items, {
      columns: headers,
    });
  } catch (error) {
    console.log(error);
  }

  return csv;
}

export default { 
  createCsv, 
  createCsvLegacy, 
  createHeaders,
  transformSubmissionQuestionTypes,
};
