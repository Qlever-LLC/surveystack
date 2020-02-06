import ObjectID from 'bson-objectid';
import { unflatten } from 'flat';

function* processPositions(data, position = []) {
  if (!data) {
    return;
  }

  for (let i = 0; i < data.length; i++) {
    const val = data[i];
    yield [...position, i];

    if (val.children) {
      yield* processPositions(val.children, [...position, i]);
    }
  }
}

const getControlPositions = (controls) => {
  const it = processPositions(controls);
  let res = it.next();
  const positions = [];
  while (!res.done) {
    positions.push(res.value);
    res = it.next();
  }

  return positions;
};

const getFlatName = (controls, position) => {
  let flatName = '';
  let control;
  let currentControls = controls;
  position.forEach((i) => {
    control = currentControls[i];
    currentControls = control.children;
    flatName += `.${control.name}`;
  });


  return flatName.substr(1);
};

const getControl = (controls, position) => {
  let control;
  let currentControls = controls;
  position.forEach((i) => {
    control = currentControls[i];
    currentControls = control.children;
  });

  if (control.type !== 'group') {
    if (control.value === undefined) {
      control.value = null;
    }
  }

  return control;
};


export const getBreadcrumbsForSubmission = (controls, position) => {
  let currentControls = controls;
  const breadcrumbs = [];
  position.forEach((i) => {
    breadcrumbs.push(currentControls[i].name);
    currentControls = currentControls[i].children;
  });

  return breadcrumbs;
};


export const flattenSubmission = (submission, delimiter = '.') => {
  const res = {};
  const positions = getControlPositions(submission.data);
  positions.forEach((p) => {
    const control = getControl(submission.data, p);
    const breadcrumbs = getBreadcrumbsForSubmission(submission.data, p);
    if (control.type !== 'group') {
      const key = breadcrumbs.join(delimiter);
      res[key] = {
        value: control.value,
        type: control.type,
      };
    }
  });
  return res;
};


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

export const linearControls = (survey, submission) => {
  const res = [];
  const { controls } = survey.versions.find(item => item.version === submission.meta.version);
  const positions = getControlPositions(controls);
  positions.forEach((p) => {
    const control = getControl(controls, p);
    const breadcrumbs = getBreadcrumbsForSubmission(controls, p);
    const submissionField = getSubmissionField(submission, survey, p);
    if (control.type !== 'group') {
      const key = breadcrumbs.join('.');
      const r = Object.assign(control, {
        breadcrumbs,
        key,
        number: p.map(value => value + 1),
        position: p,
        value: submissionField.value,
      });
      res.push(r);
    }
  });
  return res;
};

export default {
  createSubmissionFromSurvey,
  getSubmissionField,
};
