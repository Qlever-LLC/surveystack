import { get, isArray, isEqual, isNil, isObjectLike, pull, toPath, uniq } from 'lodash';
import flatten from 'flat';
import { changeRecursive, getPosition, insertControl, replaceControl } from '@/utils/surveys';

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
      const oldExists = isObjectLike(get(oldValue, subPath));
      const newExists = isObjectLike(get(newValue, subPath));
      if (oldExists && !newExists) {
        diff[subPath.join('.')] = { changeType: REMOVED };
      } else if (!oldExists && newExists) {
        diff[subPath.join('.')] = { changeType: ADDED };
      }
    }

    if (!isEqual(oldValue, newValue)) {
      const oldExists = !isNil(oldValue);
      const newExists = !isNil(newValue);
      let changeType = CHANGED;
      if (oldExists && !newExists) {
        changeType = REMOVED;
      } else if (!oldExists && newExists) {
        changeType = ADDED;
      }
      diff[field] = { oldValue, newValue, changeType };
    } else {
      diff[field] = { value: oldValue, oldValue, changeType: UNCHANGED };
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
  removeFields(['id', 'children', 'libraryId', 'libraryIsInherited', 'libraryVersion']);

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

export const diffSurveyVersions = (controlsRevisionOld, controlsRevisionNew) => {
  let removeds = flatSurveyControls(controlsRevisionOld);
  let addeds = flatSurveyControls(controlsRevisionNew);
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

  const getPropsRevisionOld = (control) => {
    const {
      control: controlRevisionOld,
      parentId: parentIdRevisionOld,
      childIndex: childIndexRevisionOld,
      path: pathRevisionOld,
    } = control;
    return {
      controlRevisionOld,
      parentIdRevisionOld,
      childIndexRevisionOld,
      pathRevisionOld,
    };
  };

  const getPropsRevisionNew = (control) => {
    const {
      control: controlRevisionNew,
      parentId: parentIdRevisionNew,
      childIndex: childIndexRevisionNew,
      path: pathRevisionNew,
    } = control;
    return {
      controlRevisionNew,
      parentIdRevisionNew,
      childIndexRevisionNew,
      pathRevisionNew,
    };
  };

  matcheds = matcheds.map(([controlRevisionOld, controlRevisionNew]) => {
    const result = {
      ...getPropsRevisionOld(controlRevisionOld),
      ...getPropsRevisionNew(controlRevisionNew),
    };

    const diff = diffControls(result.controlRevisionOld, result.controlRevisionNew);
    const changed = Object.values(diff).some(({ changeType }) => changeType !== UNCHANGED);
    const changeType = changed ? CHANGED : UNCHANGED;

    return { ...result, diff, changeType };
  });

  removeds = removeds.map((control) => ({ changeType: REMOVED, ...getPropsRevisionOld(control) }));
  addeds = addeds.map((control) => ({ changeType: ADDED, ...getPropsRevisionNew(control) }));

  return [...matcheds, ...addeds, ...removeds];
};

export function diffThreeSurveyVersions(
  controlsLocalRevision,
  controlsRemoteRevisionOld,
  controlsRemoteRevisionNew,
  reportChangeTypeBasedOnLocalRevision = false
) {
  let changesResult = [];
  //collect diff results for all controls
  const changesLocal = diffSurveyVersions(controlsRemoteRevisionOld, controlsLocalRevision);
  const changesRemote = diffSurveyVersions(controlsRemoteRevisionOld, controlsRemoteRevisionNew);
  //get changes both in changesAB and changesBC
  let changesPrimary = reportChangeTypeBasedOnLocalRevision ? changesLocal : changesRemote;
  let changesSecondary = reportChangeTypeBasedOnLocalRevision ? changesRemote : changesLocal;
  for (const changePrimary of changesPrimary) {
    if (changePrimary.changeType === CHANGED) {
      for (const changeSecondary of changesSecondary) {
        if (
          (changeSecondary.changeType === UNCHANGED ||
            changeSecondary.changeType === CHANGED ||
            changeSecondary.changeType === REMOVED) &&
          (changePrimary.controlRevisionOld.id === changeSecondary.controlRevisionOld.id ||
            changePrimary.pathRevisionOld === changeSecondary.pathRevisionOld)
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
    diff: changeRemote.diff || {},

    controlLocalRevision: changeLocal.controlRevisionNew,
    parentIdLocalRevision: changeLocal.parentIdRevisionNew,
    childIndexLocalRevision: changeLocal.childIndexRevisionNew,
    pathLocalRevision: changeLocal.pathRevisionNew,

    controlRevisionOld: changeRemote.controlRevisionOld,
    parentIdRevisionOld: changeRemote.parentIdRevisionOld,
    childIndexRevisionOld: changeRemote.childIndexRevisionOld,
    pathRevisionOld: changeRemote.pathRevisionOld,

    controlRevisionNew: changeRemote.controlRevisionNew,
    parentIdRevisionNew: changeRemote.parentIdRevisionNew,
    childIndexRevisionNew: changeRemote.childIndexRevisionNew,
    pathRevisionNew: changeRemote.pathRevisionNew,
  };

  //add all diffs of local revision
  if (changeLocal.diff) {
    for (const diffProperty in threePointChange.diff) {
      let remoteChangeProp = threePointChange.diff[diffProperty];
      const localChangeProp = Object.prototype.hasOwnProperty.call(changeLocal.diff, diffProperty)
        ? changeLocal.diff[diffProperty]
        : undefined;
      remoteChangeProp.oldValue = remoteChangeProp.oldValue || remoteChangeProp.value;
      remoteChangeProp.newValue = remoteChangeProp.newValue || remoteChangeProp.value;
      remoteChangeProp.localValue = localChangeProp ? localChangeProp.newValue || localChangeProp.value : undefined;
      if (remoteChangeProp.changeType === UNCHANGED && localChangeProp && localChangeProp.changeType === CHANGED) {
        remoteChangeProp.changeType = CHANGED;
      }
      if (
        localChangeProp &&
        localChangeProp.changeType === CHANGED &&
        //ignore resource id changes, cause these changes always happen when consuming a qsl
        !isOntologyResourceChange(threePointChange.controlLocalRevision, diffProperty) &&
        !isMatrixResourceChange(threePointChange.controlLocalRevision, diffProperty)
      ) {
        //add flog for easier detection by merge function
        threePointChange.hasLocalChange = true;
        threePointChange.changeType = CHANGED;
      }
    }
  }

  //add all diff properties of local revision missing in remote revision
  for (const localDiffProperty in changeLocal.diff) {
    const localDiffPropertyIsMissing = !Object.prototype.hasOwnProperty.call(threePointChange.diff, localDiffProperty);
    if (localDiffPropertyIsMissing) {
      //add it
      const localChangeProp = changeLocal.diff[localDiffProperty];
      threePointChange.diff[localDiffProperty] = {
        localValue: localChangeProp.newValue,
        oldValue: localChangeProp.oldValue,
        newValue: undefined,
        changeType: CHANGED,
      };
      threePointChange.hasLocalChange = true;
      threePointChange.changeType = CHANGED;
    }
  }

  if (threePointChange.hasLocalChange && hasBreakingChange(threePointChange.diff)) {
    threePointChange.hasBreakingChange = true;
  }

  return threePointChange;
}

/*
  returns merged changes from the given revisions

  merge algorithm:
  - take controlsRemoteRevisionNew as the base for the resulting revision
  - apply changes in local revision to the resulting revision if the remote change is not a breaking change
  - apply adds of "foreign" controls to the resulting revision keeping the same position
 */
export function merge(
  controlsLocalRevision,
  controlsRemoteRevisionOld,
  controlsRemoteRevisionNew,
  discardLocalChanges
) {
  let mergedControls = [...controlsRemoteRevisionNew];

  //collect changes
  let changes = diffThreeSurveyVersions(
    controlsLocalRevision,
    controlsRemoteRevisionOld,
    controlsRemoteRevisionNew,
    true
  );
  let addedGroups = [];
  //applicate local changes
  for (const change of changes) {
    switch (change.changeType) {
      case changeType.CHANGED:
        //merge local change into resulting controls except if the local change is discarded by the user or by a breaking change
        if (change.hasLocalChange && discardLocalChanges.indexOf(change.pathLocalRevision) === -1) {
          mergedControls = replaceControl(mergedControls, null, change.pathRevisionNew, change.controlLocalRevision);
        }
        break;
      case changeType.REMOVED:
        //ignore, controls can not be removed locally
        console.error('local removal of question set control detected. Ignoring this change.');
        break;
      case changeType.ADDED: {
        if (change.controlRevisionNew.type === 'group' || change.controlRevisionNew.type === 'page') {
          addedGroups.push(change.controlRevisionNew.id);
        }
        if (addedGroups.indexOf(change.parentIdRevisionNew) > -1) {
          //it's a child of an added group, do not add it cause it's added together with the group
          continue;
        }
        const position = getPosition(change.controlRevisionNew, controlsLocalRevision);
        // change position to the control before/above, cause that's expected by insertControl
        if (position[position.length - 1] === 0) {
          position.pop(); //move up
        } else {
          position[position.length - 1]--; //move back
        }
        //flag the control as consumer-added non-library-control
        changeRecursive(change.controlRevisionNew, (control) => {
          control.isNonLibraryControl = true;
        });

        //insert control
        insertControl(change.controlRevisionNew, mergedControls, position, false);
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
      diff[propertyName].changeType === CHANGED && diff[propertyName].oldValue === true && !diff[propertyName].newValue
    );
  } else {
    return false;
  }
}
