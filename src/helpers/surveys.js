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

export const getControlPositions = controls => {
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
  position.forEach(i => {
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
  position.forEach(i => {
    control = currentControls[i];
    currentControls = control.children;
    flatName += `.${control.name}`;
  });

  return flatName.substr(1);
};

export const getFlatNames = (survey, version = 1) => {
  const { controls } = survey.revisions.find(revision => revision.version === version);
  const positions = getControlPositions(controls);
  const items = [];
  positions.forEach(position => {
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

  const { controls } = survey.revisions.find(revision => revision.version === version);
  const positions = getControlPositions(controls);
  positions.forEach(position => {
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
