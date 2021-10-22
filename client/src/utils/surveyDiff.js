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
  removeFileds(['id', 'hint', 'children']);

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
 * Returns a flat object containing all the controls in the revision
 * @param {Array} controls
 * @returns {[id|path]: {control: Object, parentId: string, childIndex: number, path: string}}
 */
export const normalizedSurveyControls = (controls, { useControlPathAsId } = {}) => {
  const normalize = (controls, parentId = null, parentPath = []) => {
    let normalized = {};
    for (const [childIndex, control] of controls.entries()) {
      const path = [...parentPath, control.name];
      const strPath = path.join('.');
      const key = useControlPathAsId ? strPath : control.id;
      normalized[key] = { control, parentId, childIndex, path: strPath };

      // "page" and "group" types
      if (_.isArray(control.children)) {
        normalized = { ...normalized, ...normalize(control.children, control.id, path) };
      }
    }
    return normalized;
  };
  return normalize(controls);
};

export const diffSurveyVersions = (oldControls, newControls, { useControlPathAsId } = {}) => {
  oldControls = normalizedSurveyControls(oldControls, { useControlPathAsId });
  newControls = normalizedSurveyControls(newControls, { useControlPathAsId });
  const oldControlIds = Object.keys(oldControls);
  const newControlIds = Object.keys(newControls);
  const matchedIds = _.intersection(oldControlIds, newControlIds)
    // don't add controls with different types to matches (can happen when useControlPathAsId: true)
    .filter((id) => oldControls[id].control.type === newControls[id].control.type);
  const removedIds = _.without(oldControlIds, ...matchedIds);
  const addedIds = _.without(newControlIds, ...matchedIds);

  const getOldProps = (id) => {
    const { control: oldControl, parentId: oldParentId, childIndex: oldChildIndex, path: oldPath } = oldControls[id];
    return {
      oldControl,
      oldParentId,
      oldChildIndex,
      oldPath,
    };
  };

  const getNewProps = (id) => {
    const { control: newControl, parentId: newParentId, childIndex: newChildIndex, path: newPath } = newControls[id];
    return {
      newControl,
      newParentId,
      newChildIndex,
      newPath,
    };
  };

  const matcheds = matchedIds.map((id) => {
    const result = {
      ...getOldProps(id),
      ...getNewProps(id),
      matchId: id,
    };

    const diff = diffControls(result.oldControl, result.newControl);
    const changed = Object.values(diff).some(({ changeType }) => changeType !== UNCHANGED);
    const changeType = changed ? CHANGED : UNCHANGED;

    return {
      ...result,
      diff,
      changeType,
    };
  });
  const removeds = removedIds.map((id) => ({ changeType: REMOVED, ...getOldProps(id) }));
  const addeds = addedIds.map((id) => ({ changeType: ADDED, ...getNewProps(id) }));

  return [...matcheds, ...addeds, ...removeds];
};
