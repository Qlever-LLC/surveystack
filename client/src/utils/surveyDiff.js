import { get, isArray, isEqual, isNil, isObjectLike, pull, toPath, uniq } from 'lodash';
import flatten from 'flat';
import { getPosition, insertControl, replaceControl } from '@/utils/surveys';

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

export function diffThreeSurveyVersions(
  controlsLocalRevision,
  controlsRemoteRevisionA,
  controlsRemoteRevisionB,
  reportChangeTypeBasedOnLocalRevision = false
) {
  let changesResult = [];
  //collect diff results for all controls
  const changesLocal = diffSurveyVersions(controlsRemoteRevisionA, controlsLocalRevision);
  const changesRemote = diffSurveyVersions(controlsRemoteRevisionA, controlsRemoteRevisionB);
  //get changes both in changesAB and changesBC
  let changesPrimary = reportChangeTypeBasedOnLocalRevision ? changesLocal : changesRemote;
  let changesSecondary = reportChangeTypeBasedOnLocalRevision ? changesRemote : changesLocal;
  for (const changePrimary of changesPrimary) {
    if (changePrimary.changeType === CHANGED) {
      for (const changeSecondary of changesSecondary) {
        if (
          changePrimary.controlRevisionA.id === changeSecondary.controlRevisionA.id ||
          changePrimary.pathRevisionA === changeSecondary.pathRevisionA
        ) {
          if (reportChangeTypeBasedOnLocalRevision) {
            changesResult.push(createThreePointChange(changePrimary, changeSecondary));
          } else {
            changesResult.push(createThreePointChange(changeSecondary, changePrimary));
          }

          break;
        }
      }
    } else if (changePrimary.changeType === ADDED) {
      changesResult.push(changePrimary);
    } else if (changePrimary.changeType === REMOVED) {
      changesResult.push(changePrimary);
    } else {
      changesResult.push(changePrimary);
    }
  }
  return changesResult;
}

function createThreePointChange(changeLocal, changeRemote) {
  let threePointChange = {
    changeType: changeRemote.changeType,
    hasLocalChange: false,
    diff: changeRemote.diff,

    controlRevisionA: changeLocal.controlRevisionB,
    parentIdRevisionA: changeLocal.parentIdRevisionB,
    childIndexRevisionA: changeLocal.childIndexRevisionB,
    pathRevisionA: changeLocal.pathRevisionB,

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
    let remoteChangeProp = threePointChange.diff[diffProperty];
    const localChangeProp = Object.prototype.hasOwnProperty.call(changeLocal.diff, diffProperty)
      ? changeLocal.diff[diffProperty]
      : undefined;
    remoteChangeProp.valueC = remoteChangeProp.valueB || remoteChangeProp.value;
    remoteChangeProp.valueB = remoteChangeProp.valueA || remoteChangeProp.value;
    remoteChangeProp.valueA = localChangeProp ? localChangeProp.valueB || localChangeProp.value : undefined;
    if (remoteChangeProp.changeType === UNCHANGED && localChangeProp.changeType === CHANGED) {
      remoteChangeProp.changeType = CHANGED;
    }
    if (
      localChangeProp &&
      localChangeProp.changeType === CHANGED &&
      //ignore resource id changes, cause these changes always happen when inherting a qsl
      !isOntologyResourceChange(threePointChange.controlRevisionA, diffProperty) &&
      !isMatrixResourceChange(threePointChange.controlRevisionA, diffProperty)
    ) {
      //add flog for easier detection by merge function
      threePointChange.hasLocalChange = true;
    }
  }
  //add all diff properties of local revision missing in remote revision
  for (const localDiffProperty in changeLocal.diff) {
    const localDiffPropertyIsMissing = !Object.prototype.hasOwnProperty.call(threePointChange.diff, localDiffProperty);
    if (localDiffPropertyIsMissing) {
      //add it
      const localChangeProp = changeLocal.diff[localDiffProperty];
      threePointChange.diff[localDiffProperty] = {
        valueA: localChangeProp.valueB,
        valueB: localChangeProp.valueA,
        valueC: undefined,
        changeType: CHANGED,
      };
      threePointChange.hasLocalChange = true;
      threePointChange.changeType = CHANGED;
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
  - take remoteRevisionB as the base for the resulting revision
  - apply changes in local revision to the resulting revision if the remote change is not a breaking change
  - apply adds of "foreign" controls to the resulting revision keeping the same position
 */
export function merge(controlsLocalRevision, controlsRemoteRevisionA, controlsRemoteRevisionB) {
  let mergedControls = [...controlsRemoteRevisionB];

  //collect changes
  let changes = diffThreeSurveyVersions(controlsLocalRevision, controlsRemoteRevisionA, controlsRemoteRevisionB, true);
  let addedGroups = [];
  //applicate local changes
  for (const change of changes) {
    switch (change.changeType) {
      case changeType.CONFLICT:
        //a breaking change occurred on remote revision, discard local change
        break;
      case changeType.CHANGED:
        //merge local change into resulting controls
        if (change.hasLocalChange) {
          //TODO if the path is not available in the remote revision, add it to parent path if existing. Try until root is reached.
          mergedControls = replaceControl(mergedControls, null, change.pathRevisionC, change.controlRevisionA);
        }
        break;
      case changeType.REMOVED:
        //ignore, controls can not be removed locally
        console.error('local removal of question set control detected. Ignoring this change.');
        break;
      case changeType.ADDED: {
        if (change.controlRevisionB.type === 'group' || change.controlRevisionB.type === 'page') {
          addedGroups.push(change.controlRevisionB.id);
        }
        if (addedGroups.indexOf(change.parentIdRevisionB) > -1) {
          //it's a child of an added group, do not add it cause it's added together with the group
          continue;
        }
        const position = getPosition(change.controlRevisionB, controlsLocalRevision);
        // change position to the control before/above, cause that's expected by insertControl
        if (position[position.length - 1] === 0) {
          position.pop(); //move up
        } else {
          position[position.length - 1]--; //move back
        }
        //flag the control as consumer-added non-library-control
        change.controlRevisionB.isNonLibraryControl = true;
        //insert control
        insertControl(change.controlRevisionB, mergedControls, position, false);
        break;
      }
    }
  }

  return mergedControls;
}

function hasBreakingChange(diff) {
  return propertyTurnedOff(diff, 'options.allowHide') || propertyTurnedOff(diff, 'options.allowModify');
}

function isOntologyResourceChange(control, diffProperty) {
  return control.type === 'ontology' && diffProperty === 'options.source';
}

function isMatrixResourceChange(control, diffProperty) {
  return control.type === 'matrix' && diffProperty.startsWith('options.source') && diffProperty.endsWith('.resource');
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
