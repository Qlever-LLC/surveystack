import _ from 'lodash';
import boom from '@hapi/boom';
import { getControlPositions, getControl } from './surveys';

export const changeType = {
  CHANGED: 'changed',
  REMOVED: 'removed',
  ADDED: 'added',
  UNCHANGED: 'unchanged',
};
const { CHANGED, REMOVED, ADDED, UNCHANGED } = changeType;

const diffObject = (oldObj, newObj, fields) => {
  // TODO read change types from constants
  return fields.reduce((diff, field) => {
    const oldValue = _.get(oldObj, field);
    const newValue = _.get(newObj, field);

    const path = _.toPath(field);
    for (let i = 0; i < path.length - 1; ++i) {
      const subPath = path.slice(0, i);
      const oldExist = _.isObjectLike(_.get(oldValue, subPath));
      const newExist = _.isObjectLike(_.get(newValue, subPath));
      if (oldExist && !newExist) {
        diff[subPath.join('.')] = { changeType: REMOVED };
      } else if (!oldExist && newExist) {
        diff[subPath.join('.')] = { changeType: ADDED };
      }
    }

    if (oldValue !== newValue) {
      const oldExist = _.isNil(oldValue);
      const newExist = _.isNil(newValue);
      let changeType = CHANGED;
      if (oldExist && !newExist) {
        changeType = REMOVED;
      } else if (!oldExist && newExist) {
        changeType = ADDED;
      }
      diff[field] = { oldValue, newValue, changeType };
    } else {
      diff[field] = { value: newValue, changeType: UNCHANGED };
    }
    return diff;
  }, {});
};

class CantCompareError extends Error {}

export const diffControls = (oldControl, newControl) => {
  if (oldControl.type !== newControl.type) {
    throw new CantCompareError("Control types don't match");
  }
  const controlType = oldControl.type;
  const COMMON_CONTROL_FIELDS = [
    'name',
    'label',
    'hint',
    'options.readOnly',
    'options.required',
    'options.redacted',
    'options.relevance.enabled',
    'options.relevance.code',
    'options.constraint.enabled',
    'options.constraint.code',
    'options.calculate.enabled',
    'options.calculate.code',
    'options.apiCompose.enabled',
    'options.apiCompose.code',
  ];

  let diff = {};
  const addToDiff = (fields) => {
    diff = { ...diffObject(oldControl, newControl, fields), ...diff };
  };

  addToDiff(COMMON_CONTROL_FIELDS);

  if (['string', 'number', 'script'].includes(controlType)) {
    addToDiff(['value']);
  }
  if ('selectSingle' === controlType) {
    addToDiff(['options.allowCustomSelection']);
  }
  if ('matrix' === controlType) {
    addToDiff(['options.config.addRowLabel']);
    const MATRIX_COL_FIELDS = [
      'label',
      'value',
      'tags',
      'type',
      'resource',
      'multiple',
      'required',
      'redacted',
      'scaleWidth',
    ];
    const colCount = Math.max(
      oldControl.options.source.content.length,
      newControl.options.source.content.length
    );
    for (let i = 0; i < colCount; ++i) {
      addToDiff(MATRIX_COL_FIELDS.map((f) => `options.config.source.content[${i}].${f}`));
    }
  }
  return diff;
};

export const normalizedSurveyControls = (survey, version) => {
  const revision = survey.revisions.find(
    (revision) => parseInt(revision.version) === parseInt(version)
  );
  if (!revision) {
    throw boom.notFound("Can't find selected survey revision", {
      selectedVersion: version,
      availableVersions: survey.revisions.map((r) => r.version),
    });
  }
  const { controls } = revision;

  const normalize = (controls, parentId = null) => {
    let normalized = {};
    for (const [childIndex, control] of controls.entries()) {
      normalized[control.id] = { control, parentId, childIndex };

      // "page" and "group" types
      if (_.isArray(control.children)) {
        normalized = { ...normalized, ...normalize(control.children, control.id) };
      }
    }
    return normalized;
  };
  return normalize(controls);
};

export const diffSurveyVersions = (survey, oldVersion, newVersion) => {
  const oldControls = normalizedSurveyControls(survey, oldVersion);
  const newControls = normalizedSurveyControls(survey, newVersion);
  const oldControlIds = Object.keys(oldControls);
  const newControlIds = Object.keys(newControls);
  const commonIds = _.intersection(oldControlIds, newControlIds);
  const removedIds = _.without(oldControls, ...newControlIds);
  const addedIds = _.without(newControls, ...oldControlIds);

  const results = [];
  for (const id of commonIds) {
    const {
      control: oldControl,
      parentId: oldParentId,
      childIndex: oldChildIndex,
    } = oldControls[id];
    const {
      control: newControl,
      parentId: newParentId,
      childIndex: newChildIndex,
    } = newControls[id];
    const diff = diffControls(oldControl, newControl);
    const changed = Object.values(diff).some(({ changeType }) => changeType !== UNCHANGED);
    const changeType = changed ? CHANGED : UNCHANGED;
    results.push({
      changeType,
      diff,
      oldControl,
      newControl,
      oldParentId,
      newParentId,
      oldChildIndex,
      newChildIndex,
    });
  }

  for (id of removedIds) {
    const oldControl = oldControls[id];
    results.push({ changeType: REMOVED, oldControl });
  }

  for (id of addedIds) {
    const newControl = newControls[id];
    results.push({ changeType: ADDED, newControl });
  }
  return results;
};
