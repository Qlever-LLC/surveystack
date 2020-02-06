import ObjectID from 'bson-objectid';
import { unflatten } from 'flat';
import { getControlPositions, getControl, getFlatName } from './surveys';


/**
 * Creates and returns a new submission based off a specific survey version
 * @param {Object} survey
 * @param String version
 *
 * @returns {Object} A submission for a specific survey version.
 */
const createSubmissionFromSurvey = (survey, version = 1) => {
  const submission = {};

  submission._id = new ObjectID().toString();
  submission.survey = survey._id;
  submission.meta = {
    dateCreated: new Date(),
    version,
  };

  // TODO: handle version not found
  const { controls } = survey.versions.find(item => item.version === version);
  const positions = getControlPositions(controls);

  const objects = [];
  positions.forEach((position) => {
    const control = getControl(controls, position);
    const flatName = getFlatName(controls, position);
    objects.push({ [flatName]: { value: null, meta: { type: control.type } } });
  });

  const c = Object.assign({}, ...objects);
  submission.data = unflatten(c, { safe: true });

  return submission;
};

/**
 * Returns the object from submission's data corresponding to the current position in a survey
 * @param {Object} submission A submission entity
 * @param {Object} survey A survey entity
 * @param {Array} position The current position inside the survey
 *
 * @returns {Object} The nested object from submission's data
 */
const getSubmissionField = (submission, survey, position) => {
  // TODO: handle version not found
  const { controls } = survey.versions.find(item => item.version === submission.meta.version);

  const flatName = getFlatName(controls, position);
  const splits = flatName.split('.');

  let obj = submission.data;
  splits.forEach((key) => {
    obj = obj[key];
  });

  return obj;
};

export default {
  createSubmissionFromSurvey,
  getSubmissionField,
};
