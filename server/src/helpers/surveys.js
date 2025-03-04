import _ from 'lodash';
import boom from '@hapi/boom';

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

export const getControlPositions = (controls) => {
  const it = processPositions(controls);
  let res = it.next();
  const positions = [];
  while (!res.done) {
    positions.push(res.value);
    res = it.next();
  }

  return positions;
};

export const getControl = (controls, position) => {
  let control;
  let currentControls = controls;
  // let { controls } = survey;
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

export const getFlatName = (controls, position) => {
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

export const getFlatNames = (survey, version = 1) => {
  const { controls } = survey.revisions.find((revision) => revision.version === version);
  const positions = getControlPositions(controls);
  const items = [];
  positions.forEach((position) => {
    const flatName = getFlatName(controls, position);
    items.push(flatName);
  });
  return items;
};

export const getDuplicateControls = (survey, version = 1) => {
  const flatNames = getFlatNames(survey, version);
  const duplicates = _.filter(flatNames, (value, index, iteratee) =>
    _.includes(iteratee, value, index + 1)
  );
  return duplicates;
};

export const checkSurvey = (survey, version = 1) => {
  const controlNameExp = new RegExp('^[a-z0-9]+(_[a-z0-9]+)*$');

  const { controls } = survey.revisions.find((revision) => revision.version === version);
  const positions = getControlPositions(controls);
  positions.forEach((position) => {
    const control = getControl(controls, position);
    if (!controlNameExp.test(control.name)) {
      const flatName = getFlatName(controls, position);
      throw boom.badRequest(`Invalid control name: ${flatName}`);
    }
  });

  const flatNames = getFlatNames(survey, version);
  const duplicates = _.filter(flatNames, (value, index, iteratee) =>
    _.includes(iteratee, value, index + 1)
  );

  if (duplicates.length > 0) {
    throw boom.badRequest(`Error duplicate control ${duplicates[0]}`);
  }
};

/**
 * Returns the object from submission's data corresponding to the current position in a survey
 * @param {Object} submission A submission entity
 * @param {Object} survey A survey entity
 * @param {Array} position The current position inside the survey
 *
 * @returns {Object} The nested object from submission's data
 */
export const getSubmissionField = (submission, survey, position) => {
  // TODO: handle version not found
  const { controls } = survey.revisions.find(
    (revision) => revision.version === submission.meta.survey.version
  );

  const flatName = getFlatName(controls, position);
  const splits = flatName.split('.');

  let obj = submission.data;

  splits.forEach((key) => {
    obj = obj[key];
  });

  return obj;
};

/**
 * Calls changeFn for the passed control and recursively on its descendants controls. ChangeFn can mutate control
 * @param control to call changeFn on
 * @param changeFn(control) function to be called on control and its descendants
 */
export const changeRecursive = (control, changeFn) => {
  changeFn(control);

  if (control.children) {
    control.children.forEach((childControl) => {
      changeRecursive(childControl, changeFn);
    });
  }
};

/**
 * Calls changeFn for the passed control and recursively on its descendants controls. changeFn can mutate control
 * @param promises Array to be filled so caller can wait for them
 * @param control to call changeFn on
 * @param changeFn(control) function to be called on control and its descendants
 */
export const changeRecursiveAsync = async (promises, control, changeFn) => {
  promises.push(changeFn(control));

  if (control.children) {
    control.children.forEach((childControl) => {
      changeRecursiveAsync(promises, childControl, changeFn);
    });
  }
};
