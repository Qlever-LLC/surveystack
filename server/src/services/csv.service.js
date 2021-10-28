/* eslint no-restricted-syntax: 0 */
/* eslint no-param-reassign: 0 */
import papa from 'papaparse';
import _ from 'lodash';
import { flatten } from 'flat';

// Marker class to flag cells to be expanded into new rows in post processing
// NOTE: It stores data as JSON string. I didn't find a less hacky way 
//   to prevent `flatten` from flattening certain arrays.
export class ExpandableCell extends String {
  static fromArray(data) {
    if (!Array.isArray(data)) {
      throw new Error("Cell data has to be an array")
    }
    return new ExpandableCell(JSON.stringify(data))
  }
  toArray() {
    return JSON.parse(this)
  }
}

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
function geojsonTransformer(o) {
  if (!o.value) {
    return o;
  }
  return {
    ...o,
    value: {
      ...o.value,
      features: o.value.features.map(JSON.stringify),
    },
  };
}

/**
 * Spreads the values in the selected matrix questions into new columns
 * and converts each column data into ExpandableRow which can be converted
 * into new rows with the `expandCells()` function later in post processing
 * @param {Object} question matrix question object
 * @param {string} dataName the data name of the question
 * @param {Object} options {expandAllMatrices: Boolean} or { expandMatrix: [...dataNames] }
 * @returns 
 */
 function matrixTransformer(question, dataName, { expandAllMatrices = false, expandMatrix = [] }) {
   if (!question.value) {
     return question;
   }

   // When no expanding required, convert the matrix value to JSON
   if (!expandAllMatrices && !expandMatrix.includes(dataName)) {
     return { ...question, value: JSON.stringify(question.value) };
   }

   const flatRows = question.value.map((row) => {
     // remove the value nesting [{foo: {value: bar}}] -> [{foo: bar}]
     const denseRow = _.mapValues(row, (cell) => cell.value);
     // flatten object values {fuz: {baz: quz}} -> {"fuz.baz": quz}
     return flatten(denseRow);
   });

   // get all the column names
   const keys = _.chain(flatRows)
     .map(_.keys) // get name of each column
     .flatten()
     .uniq() // create a list of uniq column names
     .value();
   // collect each column into one cell
   const values = keys.map((key) =>
     ExpandableCell.fromArray(flatRows.map((row) => _.get(row, key, null)))
   );
   const value = _.zipObject(keys, values);
   return { ...question, value };
 }

/**
 * transform submission object for presentation in csv
 * @param {*} obj: submission object to transform
 * @param {{[string]: function}} typeHandlers: object with keys for question types to match
 * and values of transform functions to apply to those question types. Transform functions
 * should return the updated value for the question value
 * @returns updated submission object
 */
function transformSubmissionQuestionTypes(obj, typeHandlers, formatOptions) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, val]) => {
      if (typeof val === 'object' && val !== null) {
        const typeHandler = 'meta' in val
          && val.meta.type in typeHandlers
          && typeHandlers[val.meta.type];
        if (typeHandler) {
          return [key, typeHandler(val, key, formatOptions)];
        }
        return [key, transformSubmissionQuestionTypes(val, typeHandlers, formatOptions)];
      }
      return [key, val];
    })
  );
}

/**
 * Removes the `meta` object from the submission questions
 * For simple question types (`{meta: {...}, value: ...}`) it also removes the 
 *  intermediary `value` field: `{num: {meta, value: 6}} -> {num: 6}`
 * @param {Object} the `data` field of a submission 
 * @returns updated data field of a submission
 */
function removeMetaFromQuestionTypes(data) {
  // TODO these should come from some global constants, (or if we forbid to use
  // 'meta' and 'value' as data-name, we can use logic instead of these lists)
  const groupTypes = ['group', 'page'];
  const valueTypes = [
    'date',
    'farmOsFarm',
    'farmOsField',
    'farmOsPlanting',
    'geoJSON',
    'instructions',
    'instructionsImageSplit',
    'location',
    'matrix',
    'number',
    'ontology',
    'script',
    'selectMultiple',
    'selectSingle',
    'string',
  ];

  const removeMeta = (data) => {
    if (!_.isObjectLike(data) || !('meta' in data)) {
      return data;
    } else {
      if (groupTypes.includes(data.meta.type)) {
        const { meta, ...values } = data;
        return _.mapValues(values, removeMeta);
      } else if (valueTypes.includes(data.meta.type)) {
        return data.value;
      } else {
        return data;
      }
    }
  };

  return _.mapValues(data, removeMeta);
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

function expandCells(flatSubmissions) {
  return flatSubmissions
    .map((submissionRow) => {
      const expCells = Object.entries(submissionRow)
        .filter(([_, cell]) => cell instanceof ExpandableCell)
        .map(([key, cell]) => [key, cell.toArray()]);
      // find the longest column to decide how many rows we have to add
      const maxRows = Math.max(0, ...expCells.map(([_, cell]) => cell.length));
      // clear the expandable cells from the first submission row
      const mainRow = _.omit(submissionRow, expCells.map(([key,_]) => key))
      // create the expanded extra rows
      const expandedRows = _.range(maxRows).map((i) =>
        Object.fromEntries(expCells.map(([key, values]) => [key, values[i]]))
      );

      return [mainRow, ...expandedRows];
    })
    .flat();
}

function createCsv(submissions, headers) {
  let items = [];
  submissions.forEach((ss) => {
    const submission = _.cloneDeep(ss);
    // when flattening a submission, special BSON types such as ObjectId are flattened into
    // {_bsontype: 'ObjectID', id: <Buffer ...>}
    // This is to make sure ObjectIds are stringified for CSV output
    stringifyObjectIds(submission);

    // removeKeys(submission.data, ['meta']); // remove meta fields below data

    items.push(flatten(submission));
  });

  items = expandCells(items);

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

export {
  createCsv,
  createCsvLegacy,
  createHeaders,
  transformSubmissionQuestionTypes,
  geojsonTransformer,
  matrixTransformer,
  removeMetaFromQuestionTypes,
  expandCells,
};
