import { get, isObjectLike, isEqual, isNil, toPath, uniq, pull, isArray, intersection, without } from 'lodash';
import flatten from 'flat';

export const changeType = {
  CHANGED: 'changed',
  REMOVED: 'removed',
  ADDED: 'added',
  UNCHANGED: 'unchanged',
};
const { CHANGED, REMOVED, ADDED, UNCHANGED } = changeType;

const diffObject = (objectA, objectB, fields) => {
  return fields.reduce((diff, field) => {
    const valueA = get(objectA, field);
    const valueB = get(objectB, field);

    const path = toPath(field);
    for (let i = 0; i < path.length - 1; ++i) {
      const subPath = path.slice(0, i);
      const aExists = isObjectLike(get(valueA, subPath));
      const bExists = isObjectLike(get(valueB, subPath));
      if (aExists && !bExists) {
        diff[subPath.join('.')] = { changeType: REMOVED };
      } else if (!aExists && bExists) {
        diff[subPath.join('.')] = { changeType: ADDED };
      }
    }

    if (!isEqual(valueA, valueB)) {
      const aExists = !isNil(valueA);
      const bExists = !isNil(valueB);
      let changeType = CHANGED;
      if (aExists && !bExists) {
        changeType = REMOVED;
      } else if (!aExists && bExists) {
        changeType = ADDED;
      }
      diff[field] = { valueA, valueB, changeType };
    } else {
      diff[field] = { value: valueA, changeType: UNCHANGED };
    }
    return diff;
  }, {});
};

const getComparableFields = (a, b) => {
  const [flatA, flatB] = [a, b].map((c) => flatten(c, { safe: true }));
  return Object.keys({ ...flatA, ...flatB });
};

export const diffControls = (controlRevisionA, controlRevisionB) => {
  if (controlRevisionA.type !== controlRevisionB.type) {
    throw new Error("Control types don't match");
  }
  const controlType = controlRevisionA.type;

  // Collect all the object paths that we should compare
  let diffFields = [];
  let addFields = (fields) => (diffFields = uniq([...diffFields, ...fields]));
  let removeFields = (fields) => pull(diffFields, ...fields);

  // get all the object paths from the controls
  // once we have schemas for the control object, we shoul use that instead
  addFields(getComparableFields(controlRevisionA, controlRevisionB));
  // remove fields we don't need in the diff
  removeFields(['id', 'children', 'libraryId', 'libraryIsInherited', 'libraryVersion']);

  if ('matrix' === controlType) {
    const colCount = Math.max(
      controlRevisionA.options.source.content.length,
      controlRevisionB.options.source.content.length
    );
    removeFields(['options.source.content']);
    for (let i = 0; i < colCount; ++i) {
      const path = `options.source.content[${i}]`;
      const fields = getComparableFields(get(controlRevisionA, path, {}), get(controlRevisionB, path, {}));
      addFields(fields.map((f) => `${path}.${f}`));
    }
  } else if (['selectSingle', 'selectMultiple'].includes(controlType)) {
    const optionCount = Math.max(controlRevisionA.options.source.length, controlRevisionB.options.source.length);
    removeFields(['options.source']);
    for (let i = 0; i < optionCount; ++i) {
      const path = `options.source[${i}]`;
      const fields = getComparableFields(get(controlRevisionA, path, {}), get(controlRevisionB, path, {}));
      addFields(fields.map((f) => `${path}.${f}`));
    }
  }
  return diffObject(controlRevisionA, controlRevisionB, diffFields);
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

export const diffSurveyVersions = (controlsRevisionA, controlsRevisionB) => {
  let removeds = flatSurveyControls(controlsRevisionA);
  let addeds = flatSurveyControls(controlsRevisionB);
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

  const getPropsRevisionA = (control) => {
    const {
      control: controlRevisionA,
      parentId: parentIdRevisionA,
      childIndex: childIndexRevisionA,
      path: pathRevisionA,
    } = control;
    return {
      controlRevisionA,
      parentIdRevisionA,
      childIndexRevisionA,
      pathRevisionA,
    };
  };

  const getPropsRevisionB = (control) => {
    const {
      control: controlRevisionB,
      parentId: parentIdRevisionB,
      childIndex: childIndexRevisionB,
      path: pathRevisionB,
    } = control;
    return {
      controlRevisionB,
      parentIdRevisionB,
      childIndexRevisionB,
      pathRevisionB,
    };
  };

  matcheds = matcheds.map(([controlRevisionA, controlRevisionB]) => {
    const result = {
      ...getPropsRevisionA(controlRevisionA),
      ...getPropsRevisionB(controlRevisionB),
    };

    const diff = diffControls(result.controlRevisionA, result.controlRevisionB);
    const changed = Object.values(diff).some(({ changeType }) => changeType !== UNCHANGED);
    const changeType = changed ? CHANGED : UNCHANGED;

    return { ...result, diff, changeType };
  });

  removeds = removeds.map((control) => ({ changeType: REMOVED, ...getPropsRevisionA(control) }));
  addeds = addeds.map((control) => ({ changeType: ADDED, ...getPropsRevisionB(control) }));

  return [...matcheds, ...addeds, ...removeds];
};

export function controlListsHaveChanges(controlsRevisionA, controlsRevisionB) {
  return diffSurveyVersions(controlsRevisionA, controlsRevisionB).some((diff) => diff.changeType !== UNCHANGED);
}
export function diffSurveyVersionsConflictingChanges(controlsRevisionA, controlsRevisionB, controlsRevisionC) {
  const changesAB = diffSurveyVersions(controlsRevisionA, controlsRevisionB).filter(
    (diff) => diff.changeType === CHANGED
  );
  const changesBC = diffSurveyVersions(controlsRevisionB, controlsRevisionC).filter(
    (diff) => diff.changeType === CHANGED
  );
  //get changes both in changesAB and changesBC
  let conflictingChanges = [];
  for (const changeAB of changesAB) {
    for (const changeBC of changesBC) {
      if (
        (changeAB.controlRevisionA.id === changeBC.controlRevisionA.id ||
          changeAB.pathRevisionA === changeBC.pathRevisionA) &&
        hasBreakingChange(changeBC.diff)
      ) {
        const conflictingChange = {
          changeType: changeType.CHANGED,

          controlRevisionA: changeAB.controlRevisionA,
          parentIdRevisionA: changeAB.parentIdRevisionA,
          childIndexRevisionA: changeAB.childIndexRevisionA,
          pathRevisionA: changeAB.pathRevisionA,

          controlRevisionB: changeAB.controlRevisionB,
          parentIdRevisionB: changeAB.parentIdRevisionB,
          childIndexRevisionB: changeAB.childIndexRevisionB,
          pathRevisionB: changeAB.pathRevisionB,

          controlRevisionC: changeBC.controlRevisionB,
          parentIdRevisionC: changeBC.parentIdRevisionB,
          childIndexRevisionC: changeBC.childIndexRevisionB,
          pathRevisionC: changeBC.pathRevisionB,

          diff: changeAB.diff,
        };

        //add all diffs of revision C
        for (const diffProperty in conflictingChange.diff) {
          if (
            Object.prototype.hasOwnProperty.call(changeBC.diff, diffProperty) &&
            changeBC.diff[diffProperty].changeType !== UNCHANGED
          ) {
            if (conflictingChange.diff[diffProperty].changeType !== UNCHANGED) {
              //update properties ALREADY differing between A and B
              conflictingChange.diff[diffProperty].valueC = changeBC.diff[diffProperty].valueB;
            } else {
              conflictingChange.diff[diffProperty].valueA = conflictingChange.diff[diffProperty].value;
              conflictingChange.diff[diffProperty].valueB = conflictingChange.diff[diffProperty].value;
              conflictingChange.diff[diffProperty].valueC = changeBC.diff[diffProperty].valueB;
              conflictingChange.diff[diffProperty].changeType = changeBC.diff[diffProperty].changeType;
            }
          }
        }

        conflictingChanges.push(conflictingChange);
      }
    }
  }
  return conflictingChanges;
}
/*
  returns merged changes from the given revisions
 */
export function merge(controlsLocalRevision, controlsRemoteRevisionA, controlsRemoteRevisionB) {
  let mergedControls = [...controlsLocalRevision];

  //collect changes
  let localChanges = diffSurveyVersions(controlsLocalRevision, controlsRemoteRevisionA);
  let remoteChanges = diffSurveyVersions(controlsRemoteRevisionA, controlsRemoteRevisionB);
  //applicate remote changes on local survey
  for (const change of remoteChanges) {
    switch (change.changeType) {
      case changeType.CHANGED:
        mergedControls = replaceControlIfBreakingChange(mergedControls, change);
        break;
      case changeType.REMOVED:
        mergedControls = removeControl(mergedControls, change.childIndexRevisionA);
        break;
      case changeType.ADDED:
        mergedControls = insertControl(mergedControls, change.controlRevisionB, change.childIndexRevisionB);
        break;
    }
  }

  return mergedControls;
}

/*
    replaces controls if one of the following requirements are met:
    - control has no local change, but remote changes
    - control has local change and remote breaking changes
 */
function replaceControlIfBreakingChange(destControls, change) {
  // sustain local change except allowHide is turned off remotely and hidden is true locally, or allowModify turned off remotely)
  //TODO also update local revision if noLocalChange was done
  if (hasBreakingChange(change.diff)) {
    return destControls.map((c, idx) => (idx === change.childIndexRevisionB ? change.controlRevisionB : c));
  } else {
    return destControls;
  }
}

function removeControl(destControls, index) {
  return destControls.filter((c, idx) => index !== idx);
}

function insertControl(destControls, control, index) {
  return destControls.map((c, idx) => (idx === index ? control : c));
}

function hasBreakingChange(diff) {
  return propertyTurnedOff(diff, 'options.allowHide') || propertyTurnedOff(diff, 'options.allowModify');
}

function propertyTurnedOff(diff, propertyName) {
  const property = Object.prototype.hasOwnProperty.call(diff, propertyName);
  if (property) {
    return (
      diff[propertyName].changeType === 'changed' && diff[propertyName].valueA === true && !diff[propertyName].valueB
    );
  } else {
    return false;
  }
}
