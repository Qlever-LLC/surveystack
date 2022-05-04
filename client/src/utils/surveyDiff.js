import { get, isArray, isEqual, isNil, isObjectLike, pull, toPath, uniq } from 'lodash';
import flatten from 'flat';
import { replaceControl } from '@/utils/surveys';

export const changeType = {
  CHANGED: 'changed',
  CONFLICT: 'conflict',
  REMOVED: 'removed',
  ADDED: 'added',
  UNCHANGED: 'unchanged',
};
const { CHANGED, CONFLICT, REMOVED, ADDED, UNCHANGED } = changeType;

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

export function diffHasConflicts(controlsLocalRevision, controlsRemoteRevisionA, controlsRemoteRevisionB) {
  return diffThreeSurveyVersions(controlsLocalRevision, controlsRemoteRevisionA, controlsRemoteRevisionB).some(
    (diff) => diff.changeType === CONFLICT
  );
}

export function diffThreeSurveyVersions(controlsLocalRevision, controlsRemoteRevisionA, controlsRemoteRevisionB) {
  //collect diff results for all controls
  const changesLocal = diffSurveyVersions(controlsLocalRevision, controlsRemoteRevisionA);
  const changesRemote = diffSurveyVersions(controlsRemoteRevisionA, controlsRemoteRevisionB);
  //get changes both in changesAB and changesBC
  let changes = [];
  for (const changeRemote of changesRemote) {
    if (changeRemote.changeType === CHANGED) {
      for (const changeLocal of changesLocal) {
        if (
          changeRemote.controlRevisionA.id === changeLocal.controlRevisionA.id ||
          changeRemote.pathRevisionA === changeLocal.pathRevisionA
          //&& hasBreakingChange(changeRemote.diff)
        ) {
          changes.push(createThreePointChange(changeLocal, changeRemote));
          break;
        }
      }
    } else if (changeRemote.changeType === ADDED) {
      changes.push(changeRemote);
    } else if (changeRemote.changeType === REMOVED) {
      changes.push(changeRemote);
    } else {
      changes.push(changeRemote);
    }
  }
  return changes;
}

function createThreePointChange(changeLocal, changeRemote) {
  let threePointChange = {
    changeType: changeRemote.changeType,
    diff: changeRemote.diff,

    controlRevisionA: changeLocal.controlRevisionA,
    parentIdRevisionA: changeLocal.parentIdRevisionA,
    childIndexRevisionA: changeLocal.childIndexRevisionA,
    pathRevisionA: changeLocal.pathRevisionA,

    controlRevisionB: changeRemote.controlRevisionA,
    parentIdRevisionB: changeRemote.parentIdRevisionA,
    childIndexRevisionB: changeRemote.childIndexRevisionA,
    pathRevisionB: changeRemote.pathRevisionA,

    controlRevisionC: changeRemote.controlRevisionB,
    parentIdRevisionC: changeRemote.parentIdRevisionB,
    childIndexRevisionC: changeRemote.childIndexRevisionB,
    pathRevisionC: changeRemote.pathRevisionB,
  };

  //add all diffs of local revision
  for (const diffProperty in threePointChange.diff) {
    const remoteChangeProp = threePointChange.diff[diffProperty];
    const localChangeProp = Object.prototype.hasOwnProperty.call(changeLocal.diff, diffProperty)
      ? changeLocal.diff[diffProperty]
      : undefined;
    remoteChangeProp.valueC = remoteChangeProp.valueB || remoteChangeProp.value;
    remoteChangeProp.valueB = remoteChangeProp.valueA || remoteChangeProp.value;
    remoteChangeProp.valueA = localChangeProp ? localChangeProp.valueA || localChangeProp.value : undefined;
    if (remoteChangeProp.changeType === UNCHANGED && localChangeProp.changeType === CHANGED) {
      remoteChangeProp.changeType = CHANGED;
    }
  }

  if (hasBreakingChange(threePointChange.diff)) {
    threePointChange.changeType = CONFLICT;
  }

  return threePointChange;
}

/*
  returns merged changes from the given revisions

  merge algorithm:
  - apply all adds and removes in remote revisions to the local revision
  - apply changes in remote revisions to unchanged local revision
  - apply changes in remote revision to changed local revision if remote change is breaking change
  - do not apply changes in remote revision to changed local revision if remote change is NOT breaking change
 */
export function merge(controlsLocalRevision, controlsRemoteRevisionA, controlsRemoteRevisionB) {
  let mergedControls = [...controlsLocalRevision];
  //TODO let mergedControls = flatSurveyControls(controlsLocalRevision);

  //collect changes
  let changes = diffThreeSurveyVersions(controlsLocalRevision, controlsRemoteRevisionA, controlsRemoteRevisionB);
  //applicate remote changes on local survey
  for (const change of changes) {
    switch (change.changeType) {
      case changeType.CONFLICT:
        mergedControls = replaceControl(mergedControls, null, change.pathRevisionC, change.controlRevisionC);
        break;
      case changeType.CHANGED:
        //mergedControls = replaceControlIfBreakingChange(mergedControls, change);
        //DO NOT REPLACE LOCAL VERSION AS IT'S NOT CONFLICTING
        break;
      case changeType.REMOVED:
        mergedControls = removeControl(mergedControls, change.childIndexRevisionB);
        break;
      case changeType.ADDED:
        mergedControls = insertControl(mergedControls, change.controlRevisionC, change.childIndexRevisionC);
        break;
    }
  }

  return mergedControls;
}

function removeControl(destControls, index) {
  //TODO does not find childs in groups
  return destControls.filter((c, idx) => index !== idx);
}

function insertControl(destControls, control, index) {
  //TODO does not find childs in groups
  return destControls.map((c, idx) => (idx === index ? control : c));
}

function hasBreakingChange(diff) {
  return propertyTurnedOff(diff, 'options.allowHide') || propertyTurnedOff(diff, 'options.allowModify');
}

function propertyTurnedOff(diff, propertyName) {
  const property = Object.prototype.hasOwnProperty.call(diff, propertyName);
  if (property) {
    return (
      diff[propertyName].changeType === CHANGED && diff[propertyName].valueB === true && !diff[propertyName].valueC
    );
  } else {
    return false;
  }
}
