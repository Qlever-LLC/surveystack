/* eslint no-restricted-syntax: 0 */
/* eslint no-param-reassign: 0 */
import papa from 'papaparse';
import _ from 'lodash';
import { flatten } from 'flat';

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

// TODO: make pure / quit mutating
/**
 *
 * @param {*} obj: submissions object to transform
 * @param {{[string]: function}} typeHandlers: object with keys for question types to match
 * and values of transform functions to apply to those question types. Transform functions
 * should return the updated value for the question value
 * @returns void
 *  TODO: stop mutating in place!
 */
function transformQuestionTypes(obj, typeHandlers) {
  if (!obj) {
    return;
  }
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const typeHandler = 'meta' in obj[key]
        && obj[key].meta.type in typeHandlers
        && typeHandlers[obj[key].meta.type];
      if (typeHandler) {
        obj[key] = typeHandler(obj[key]);
      } else {
        transformQuestionTypes(obj[key], typeHandlers);
      }
    }
  }
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
  submissions.forEach((s) => {
    const submission = _.cloneDeep(s);
    submission._id = submission._id.toString();

    if (submission.meta) {
      if (submission.meta.survey && submission.meta.survey.id) {
        submission.meta.survey.id = submission.meta.survey.id.toString();
      }

      if (submission.meta.group && submission.meta.group.id) {
        submission.meta.group.id = submission.meta.group.id.toString();
      }

      if (submission.meta.creator) {
        submission.meta.creator = submission.meta.creator.toString();
      }

      if (submission.meta.original) {
        submission.meta.original = submission.meta.original.toString();
      }

      if (submission.meta.resubmitter) {
        submission.meta.resubmitter = submission.meta.resubmitter.toString();
      }
    }

    // transform GeoJSON question type result table output to only flatten
    // down to the level of each Feature in the FeatureCollection
    transformQuestionTypes(
      submission.data,
      {
        geoJSON: o => ({
          ...o,
          value: {
            ...o.value,
            features: o.value.features.map(JSON.stringify),
          },
        }),
      },
    );
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
};
