import _ from 'lodash';
import flatten from 'flat';

export const changeType = {
  CHANGED: 'changed',
  REMOVED: 'removed',
  ADDED: 'added',
  UNCHANGED: 'unchanged',
};
const { CHANGED, REMOVED, ADDED, UNCHANGED } = changeType;

const diffObject = (oldObj, newObj, fields) => {
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

const getComparableFields = (a, b) => {
  const [flatA, flatB] = [a, b].map((c) => flatten(c, { safe: true }));
  return Object.keys({ ...flatA, ...flatB });
};

export const diffControls = (oldControl, newControl) => {
  if (oldControl.type !== newControl.type) {
    throw new CantCompareError("Control types don't match");
  }
  const controlType = oldControl.type;

  // Collect all the object paths that we should compare
  let diffFields = [];
  let addFileds = (fields) => (diffFields = _.uniq([...diffFields, ...fields]));
  let removeFileds = (fields) => _.pull(diffFields, ...fields);

  // get all the object paths from the controls
  // once we have schemas for the control object, we shoul use that instead
  addFileds(getComparableFields(oldControl, newControl));
  // remove fields we don't need in the diff
  removeFileds(['hint', 'children']);

  if ('matrix' === controlType) {
    const colCount = Math.max(oldControl.options.source.content.length, newControl.options.source.content.length);
    removeFileds(['options.source.content']);
    for (let i = 0; i < colCount; ++i) {
      const path = `options.source.content[${i}]`;
      const fields = getComparableFields(_.get(oldControl, path, {}), _.get(newControl, path, {}));
      addFileds(fields.map((f) => `${path}.${f}`));
    }
  }
  return diffObject(oldControl, newControl, diffFields);
};

/**
 * Returns a flat list of all the controls in the revision
 * @param {Object} revision
 * @returns [{control: Object, parentId: string, childIndex: number, path: string}, ...]
 */
export const normalizedSurveyControls = (revision) => {
  const { controls } = revision;

  const normalize = (controls, parentId = null, parentPath = ['data']) => {
    let normalized = {};
    for (const [childIndex, control] of controls.entries()) {
      const path = [...parentPath, control.name];
      normalized[control.id] = { control, parentId, childIndex, path: path.join('.') };

      // "page" and "group" types
      if (_.isArray(control.children)) {
        normalized = { ...normalized, ...normalize(control.children, control.id, path) };
      }
    }
    return normalized;
  };
  return normalize(controls);
};

export const diffSurveyVersions = (oldRevision, newRevision) => {
  const oldControls = normalizedSurveyControls(oldRevision);
  const newControls = normalizedSurveyControls(newRevision);
  const oldControlIds = Object.keys(oldControls);
  const newControlIds = Object.keys(newControls);
  const commonIds = _.intersection(oldControlIds, newControlIds);
  const results = [];

  for (const id of _.union(newControlIds, oldControlIds)) {
    const result = { controlId: id };

    // Add the old version to the result
    if (oldControlIds.includes(id)) {
      const { control: oldControl, parentId: oldParentId, childIndex: oldChildIndex, path: oldPath } = oldControls[id];
      Object.assign(result, {
        oldControl,
        oldParentId,
        oldChildIndex,
        oldPath,
        changeType: REMOVED,
      });
    }

    // Add the new version to the result
    if (newControlIds.includes(id)) {
      const { control: newControl, parentId: newParentId, childIndex: newChildIndex, path: newPath } = newControls[id];
      Object.assign(result, {
        newControl,
        newParentId,
        newChildIndex,
        newPath,
        changeType: ADDED,
      });
    }

    // Add the diff to the result
    if (commonIds.includes(id)) {
      const diff = diffControls(result.oldControl, result.newControl);
      const changed = Object.values(diff).some(({ changeType }) => changeType !== UNCHANGED);
      const changeType = changed ? CHANGED : UNCHANGED;
      Object.assign(result, {
        diff,
        changeType,
      });
    }

    results.push(result);
  }

  return results;
};
