import { get, isObjectLike, isEqual, isNil, toPath, uniq, pull, isArray, intersection, without } from 'lodash';
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
    const oldValue = get(oldObj, field);
    const newValue = get(newObj, field);

    const path = toPath(field);
    for (let i = 0; i < path.length - 1; ++i) {
      const subPath = path.slice(0, i);
      const oldExist = isObjectLike(get(oldValue, subPath));
      const newExist = isObjectLike(get(newValue, subPath));
      if (oldExist && !newExist) {
        diff[subPath.join('.')] = { changeType: REMOVED };
      } else if (!oldExist && newExist) {
        diff[subPath.join('.')] = { changeType: ADDED };
      }
    }

    if (!isEqual(oldValue, newValue)) {
      const oldExist = !isNil(oldValue);
      const newExist = !isNil(newValue);
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

const getComparableFields = (a, b) => {
  const [flatA, flatB] = [a, b].map((c) => flatten(c, { safe: true }));
  return Object.keys({ ...flatA, ...flatB });
};

export const diffControls = (oldControl, newControl) => {
  if (oldControl.type !== newControl.type) {
    throw new Error("Control types don't match");
  }
  const controlType = oldControl.type;

  // Collect all the object paths that we should compare
  let diffFields = [];
  let addFields = (fields) => (diffFields = uniq([...diffFields, ...fields]));
  let removeFields = (fields) => pull(diffFields, ...fields);

  // get all the object paths from the controls
  // once we have schemas for the control object, we shoul use that instead
  addFields(getComparableFields(oldControl, newControl));
  // remove fields we don't need in the diff
  removeFields(['id', 'hint', 'children', 'libraryId', 'libraryIsInherited', 'libraryVersion']);

  if ('matrix' === controlType) {
    const colCount = Math.max(oldControl.options.source.content.length, newControl.options.source.content.length);
    removeFields(['options.source.content']);
    for (let i = 0; i < colCount; ++i) {
      const path = `options.source.content[${i}]`;
      const fields = getComparableFields(get(oldControl, path, {}), get(newControl, path, {}));
      addFields(fields.map((f) => `${path}.${f}`));
    }
  } else if (['selectSingle', 'selectMultiple'].includes(controlType)) {
    const optionCount = Math.max(oldControl.options.source.length, newControl.options.source.length);
    removeFields(['options.source']);
    for (let i = 0; i < optionCount; ++i) {
      const path = `options.source[${i}]`;
      const fields = getComparableFields(get(oldControl, path, {}), get(newControl, path, {}));
      addFields(fields.map((f) => `${path}.${f}`));
    }
  }
  return diffObject(oldControl, newControl, diffFields);
};

/**
 * Returns a flat array of all the controls in the revision
 * @param {Array} controls
 * @returns {control: Object, parentId: string, childIndex: number, path: string}[]
 */
export const flatSurveyControls = (controls) => {
  const normalize = (controls, parentId = null, parentPath = []) => {
    let normalized = [];
    for (const [childIndex, control] of controls.entries()) {
      const path = [...parentPath, control.name];
      const strPath = path.join('.');
      normalized.push({ control, parentId, childIndex, path: strPath });

      // "page" and "group" types
      if (isArray(control.children)) {
        normalized = [...normalized, ...normalize(control.children, control.id, path)];
      }
    }
    return normalized;
  };
  return normalize(controls);
};

export const diffSurveyVersions = (oldControls, newControls) => {
  let removeds = flatSurveyControls(oldControls);
  let addeds = flatSurveyControls(newControls);
  let matcheds = [];

  // Moves found matches from the `addeds`, `removeds` arrays into `matcheds`
  const extractMatchesBy = (predictate) => {
    for (const a of [...addeds]) {
      const predictateA = predictate(a);
      for (const b of [...removeds]) {
        if (a.control.type === b.control.type && predictateA === predictate(b)) {
          pull(addeds, a);
          pull(removeds, b);
          matcheds.push([b, a]);
          break;
        }
      }
    }
  };
  // Try to find matches by control.id first and then by control-path
  //  Matching by control-path is useful because in QSL's the control.id
  //  always changes when we update a library
  extractMatchesBy((c) => c.control.id);
  extractMatchesBy((c) => c.path);

  const getOldProps = (control) => {
    const { control: oldControl, parentId: oldParentId, childIndex: oldChildIndex, path: oldPath } = control;
    return {
      oldControl,
      oldParentId,
      oldChildIndex,
      oldPath,
    };
  };

  const getNewProps = (control) => {
    const { control: newControl, parentId: newParentId, childIndex: newChildIndex, path: newPath } = control;
    return {
      newControl,
      newParentId,
      newChildIndex,
      newPath,
    };
  };

  matcheds = matcheds.map(([oldControl, newControl]) => {
    const result = {
      ...getOldProps(oldControl),
      ...getNewProps(newControl),
    };

    const diff = diffControls(result.oldControl, result.newControl);
    const changed = Object.values(diff).some(({ changeType }) => changeType !== UNCHANGED);
    const changeType = changed ? CHANGED : UNCHANGED;

    return { ...result, diff, changeType };
  });

  removeds = removeds.map((control) => ({ changeType: REMOVED, ...getOldProps(control) }));
  addeds = addeds.map((control) => ({ changeType: ADDED, ...getNewProps(control) }));

  return [...matcheds, ...addeds, ...removeds];
};

export function controlListsHaveChanges(oldControls, newControls) {
  return diffSurveyVersions(oldControls, newControls).some((diff) => diff.changeType !== changeType.UNCHANGED);
}
export function getChangesOnly(oldControls, newControls) {
  return diffSurveyVersions(oldControls, newControls).filter((diff) => diff.changeType === changeType.CHANGED);
}
