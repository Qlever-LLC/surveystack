import ObjectID from 'bson-objectid';
import { flatten, unflatten } from 'flat';
import { cloneDeep } from 'lodash';
import moment from 'moment';
import * as constants from '@/constants';

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

  if (control.type !== 'group' && control.type !== 'page') {
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

/**
 * Creates and returns a new submission based off a specific survey version
 * @param {Object} survey
 * @param String version
 *
 * @returns {Object} A submission for a specific survey version.
 */
const createSubmissionFromSurvey = ({ survey, version = 1, instance, submitAsUser = undefined }) => {
  const submission = {};
  const dateNow = moment().toISOString(true);

  submission._id = new ObjectID().toString();
  submission.meta = {
    dateCreated: dateNow,
    dateModified: dateNow,
    dateSubmitted: null,
    survey: { id: survey._id, version },
    revision: 1,
    permissions: [],
    status: [],
    group: {
      id: survey.meta.group.id,
      path: survey.meta.group.path,
    },
    specVersion: constants.SPEC_VERSION_SUBMISSION,
    submitAsUser: submitAsUser,
  };

  // TODO: handle version not found
  const { controls } = survey.revisions.find((revision) => revision.version === version);
  const positions = getControlPositions(controls);

  let flattenedInstance;
  if (instance) {
    flattenedInstance = flatten(instance.data);
  }

  const objects = [];
  positions.forEach((position) => {
    const control = getControl(controls, position);
    const flatName = getFlatName(controls, position);
    let v = null;
    if (flattenedInstance) {
      const keys = Object.keys(flattenedInstance).filter((o) => o.startsWith(`${flatName}.value`));
      if (keys.length === 1) {
        // eslint-disable-next-line prefer-destructuring
        v = flattenedInstance[keys[0]];
      } else {
        // if this is an object
        const inner = {};
        // eslint-disable-next-line no-restricted-syntax
        for (const k of keys) {
          const len = `${flatName}.value`.length;
          const updatedKey = k.substring(len + 1); // '.' char
          inner[updatedKey] = flattenedInstance[k];
        }
        v = unflatten(inner);
        // console.log('unflattened');
      }
    }
    const dateModified = flattenedInstance ? flattenedInstance[`${flatName}.meta.dateModified`] : null;
    const meta = { type: control.type, dateModified };
    // add uuid: uuidv4(), if uuid

    if (control.options.redacted) {
      meta.permissions = ['admin'];
    }

    const entry = { value: v || null, meta };
    if (control.type === 'group' || control.type === 'page') {
      delete entry.value;
      delete entry.meta.dateModified;
    }

    objects.push({ [flatName]: entry });
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
  const { controls } = survey.revisions.find((revision) => revision.version === submission.meta.survey.version);

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
  const { controls } = survey.revisions.find((revision) => revision.version === submission.meta.survey.version);
  const positions = getControlPositions(controls);
  positions.forEach((p) => {
    const control = cloneDeep(getControl(controls, p));
    const breadcrumbs = getBreadcrumbsForSubmission(controls, p);
    const submissionField = getSubmissionField(submission, survey, p);
    if (control.type !== 'group' && !!submissionField) {
      const key = breadcrumbs.join('.');
      const r = Object.assign(control, {
        breadcrumbs,
        key,
        number: p.map((value) => value + 1),
        position: p,
        value: submissionField.value,
        meta: submissionField.meta,
      });
      res.push(r);
    }
  });
  return res;
};

export const linearControlsWithGroups = (survey, submission) => {
  const res = [];
  const { controls } = survey.revisions.find((revision) => revision.version === submission.meta.survey.version);
  const positions = getControlPositions(controls);
  positions.forEach((p) => {
    const control = cloneDeep(getControl(controls, p));
    const breadcrumbs = getBreadcrumbsForSubmission(controls, p);
    const submissionField = getSubmissionField(submission, survey, p);
    if (!submissionField) {
      return;
    }

    const key = breadcrumbs.join('.');
    const r = Object.assign(control, {
      breadcrumbs,
      key,
      number: p.map((value) => value + 1),
      position: p,
      value: submissionField.value,
      meta: submissionField.meta,
    });
    res.push(r);
  });
  return res;
};

export default {
  createSubmissionFromSurvey,
  getSubmissionField,
};
