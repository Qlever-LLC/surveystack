/* eslint-disable no-mixed-operators */
/* eslint-disable no-new-func */
/* eslint-disable no-bitwise */

import { cloneDeep, set } from 'lodash';
import { SPEC_VERSION_SURVEY } from '@/constants';
import supplySandbox from './supplySandbox';
import ObjectID from 'bson-objectid';
import { flatSurveyControls } from '@/utils/surveyDiff';

function* processJsDoc(data, namespace = 'data') {
  if (!data) {
    return;
  }

  for (let i = 0; i < data.length; i++) {
    const val = data[i];

    let type = 'any';
    switch (val.type) {
      case 'group':
        type = 'Object';
        break;
      case 'number':
        type = 'number';
        break;
      case 'string':
        type = 'string';
        break;
      default:
        type = 'any';
    }

    yield `@param {${type}} ${namespace === '' ? namespace : `${namespace}.`}${val.name}`;

    if (val.children) {
      yield* processJsDoc(val.children, `${namespace === '' ? namespace : `${namespace}.`}${val.name}`);
    }
  }
}

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
 * Replaces a control by its path
 * @param controls control list to be changed
 * @param parentPath parent path of the controls passed
 * @param replacePath path of the control to be replaced
 * @param replacementControl new control which replaces the control at the replacePath
 */
export const replaceControl = (controls, parentPath, replacePath, replacementControl) => {
  return controls.map((control) => {
    let currentPath = parentPath ? [parentPath, control.name].join('.') : control.name;
    if (currentPath === replacePath) {
      const replacementControlCopy = cloneDeep(replacementControl);
      replacementControlCopy.children = control.children; //only replace the control data itself, but keep the children, otherwise, locally added custom controls would be added twice (here and below)
      return replacementControlCopy;
    } else if (control.children) {
      control.children = replaceControl(control.children, currentPath, replacePath, replacementControl);
      return control;
    } else {
      return control;
    }
  });
};

/**
 * Prepares the passed library control or resource to be consumed in another survey
 * @param controlOrResource control to be prepared, mutating
 * @param libraryId the library id the control/resource originated from
 * @param libraryVersion the library version the control/resource originated from
 */
export const prepareToAddFromLibrary = (controlOrResource, libraryId, libraryVersion) => {
  controlOrResource.id = new ObjectID().toString();
  if (controlOrResource.libraryId) {
    // do not overwrite the libraryId cause it references another library the inherited library consists of
    controlOrResource.libraryIsInherited = true;
  } else if (controlOrResource.isNonLibraryControl) {
    // this flag is set by surveyDiff.js:merge to indicate that this is a consumer-added, non-library control
    delete controlOrResource.isNonLibraryControl;
  } else {
    // set library data
    controlOrResource.libraryId = libraryId;
    controlOrResource.libraryVersion = libraryVersion;
  }
};

/**
 * Returns new resources copied from library survey
 * @param librarySurvey
 * @returns [resources] with property origin set to the original id of the resource before copying
 */
export const getPreparedLibraryResources = (librarySurvey) => {
  return librarySurvey.resources.map((r) => {
    r.origin = r.id;
    prepareToAddFromLibrary(r, librarySurvey._id, librarySurvey.latestVersion);
    return r;
  });
};

/**
 * Returns an updated resource id referencing the new resource id
 * If oldResources are passed, we try to find matches via newResource.origin===oldResource.origin and oldResource.id===oldId
 * If oldResources are NOT passed, we try to find matches via newResource.origin===oldId
 *
 * @param oldId old resource id
 * @param oldResources (optional) old resources containing id's and origin's
 * @param newResources old resources containing id's and origin's
 * @returns {*} the new resource id if found, otherwise returns oldId
 */
const getUpdatedResourceId = (oldId, oldResources, newResources) => {
  let matchingResource;

  if (oldResources) {
    matchingResource = newResources.find((newRes) => {
      const matchingOldRes = oldResources.find((oldRes) => oldRes.origin === newRes.origin);
      if (matchingOldRes) {
        return matchingOldRes.id === oldId;
      } else {
        return false;
      }
    });
  }

  if (!matchingResource) {
    matchingResource = newResources.find((r) => r.origin === oldId);
  }
  if (matchingResource) {
    return matchingResource.id;
  } else {
    return oldId;
  }
};

/**
 * Updates a control's references to new resources
 * @param control the control to update
 * @param newResources an array of resources containing updated id's, with the old id stored in the origin property
 * @param oldResources optional, an array of resources containing updated id's, with the old id stored in the origin property
 * @returns [controls]
 */
export const replaceResourceReferenceId = (control, newResources, oldResources) => {
  if (newResources && control && control.options && control.options.source) {
    // replace the control's reference(s) by the new ids of the resources
    if (control.type === 'matrix') {
      control.options.source.content.forEach((col) => {
        if (col.resource) {
          col.resource = getUpdatedResourceId(col.resource, oldResources, newResources);
        }
      });
    } else if (control.type === 'instructionsImageSplit') {
      control.options.source.images.forEach((image, index, images) => {
        images[index] = getUpdatedResourceId(image, oldResources, newResources);
      });
    } else {
      control.options.source = getUpdatedResourceId(control.options.source, oldResources, newResources);
    }
  }
};

/**
 * Returns new controls copied from library survey
 * @param librarySurveyId
 * @param librarySurveyLatestVersion
 * @param controlsToAdd
 * @param newResources an array of resources containing updated id's, with the old id stored in the origin property
 * @param oldResources an array of resources containing updated id's, with the old id stored in the origin property
 * @returns [controls]
 */
export const getPreparedLibraryControls = (
  librarySurveyId,
  librarySurveyLatestVersion,
  controlsToAdd,
  newResources,
  oldResources
) => {
  return controlsToAdd.map((controlToAdd) => {
    changeRecursive(controlToAdd, (control) => {
      prepareToAddFromLibrary(control, librarySurveyId, librarySurveyLatestVersion);
      replaceResourceReferenceId(control, newResources, oldResources);
    });
    return controlToAdd;
  });
};

export const isResourceReferenced = (controls, resourceId) => {
  return flatSurveyControls(controls).some(({ control }) => {
    if (control.type === 'matrix') {
      return control.options.source.content.some(
        (contentEl) => contentEl.resource && contentEl.resource === resourceId
      );
    } else if (control.type === 'instructionsImageSplit') {
      return control.options.source.images.some((image) => image === resourceId);
    } else {
      return control.options.source === resourceId;
    }
  });
};

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

export const getJsDoc = (survey, namespace = 'data') => {
  const it = processJsDoc(survey.controls, namespace);
  let res = it.next();
  const annotations = [];
  while (!res.done) {
    annotations.push(res.value);
    res = it.next();
  }

  const doc = annotations.map((annotation) => ` * ${annotation}`).join('\n');

  return `/**
 * @param {Object} ${namespace}
${doc}
*/`;
};

export const getAdvancedCodeTemplate = (survey) => {
  const doc = getJsDoc(survey);
  return `${doc}
function calculate(data) {
  return "";
}

${doc}
function showQuestion(data) {
  return true;
}`;
};

export const getControl = (controls, position) => {
  let control;
  let currentControls = controls;

  for (const p of position) {
    control = currentControls[p];
    currentControls = control.children;
  }

  if (control.type !== 'group' && control.type !== 'page') {
    if (control.value === undefined) {
      control.value = null;
    }
  }

  return control;
};

export const getPosition = (control, controls) => {
  const positions = getControlPositions(controls);
  for (let i = 0; i < positions.length; i++) {
    const position = positions[i];
    const c = getControl(controls, position);
    if (c === control) {
      return position;
    }
  }
  return null;
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

  return flatName.substring(1);
};

/**
 * Returns the control at the given position in controls. Falls back to highest position if the passed position is out of range
 * @param controls
 * @param position
 * @returns {*}
 */
export const getControlByPosition = (controls, position) => {
  return controls[position] || controls[controls.length - 1];
};

export const insertControl = (controlToInsert, controls, position, selectedControlIsGroup) => {
  let currentControl;
  let currentControls = controls;
  let index = position[0];

  let exit = false;

  for (let i = 0; i < position.length; i++) {
    currentControl = getControlByPosition(currentControls, position[i]);
    index = position[i];
    if (currentControl.type === 'group' || currentControl.type === 'page') {
      if (exit || controlToInsert.type === 'page') {
        break;
      }
      if (i === position.length - 1 && !selectedControlIsGroup) {
        exit = true;
        break;
      }
      currentControls = currentControl.children;
    }
  }

  currentControls.splice(index + 1, 0, controlToInsert);
};

export const uuidv4 = () => {
  const rnd = new Uint8Array(32);
  crypto.getRandomValues(rnd);
  let count = 0;
  const u = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = rnd[count++] % 16;

    if (c === 'x') {
      return r.toString(16);
    }
    return ((r & 0x3) | 0x8).toString(16);
  });
  return u;
};

// eslint-disable-next-line no-unused-vars
function _has(target, key) {
  return true;
}

function _get(target, key) {
  if (key === Symbol.unscopables) return undefined;
  return target[key];
}

export function compileSandbox(src, fname) {
  const wrappedSource = `with (sandbox) { ${src}\nreturn ${fname}(arg1, arg2, arg3); }`;
  let AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const code = new AsyncFunction('sandbox', wrappedSource);

  return async function (sandbox) {
    const sandboxProxy = new Proxy(sandbox, { _has, _get });
    return await code(sandboxProxy);
  };
}

export async function executeUnsafe({ code, fname, submission, survey, parent, log }) {
  const sandbox = compileSandbox(code, fname);

  const res = await sandbox({
    arg1: submission,
    arg2: survey,
    arg3: parent,
    log,
    ...supplySandbox,
  });

  return res;
}

/**
 * Finds the parent control object given a child control's id and a nested list of controls
 * @param {string} controlId - The ObjectID string for the control for which to find the parent control.
 * @param {array} controls - The nested controls array to search through.
 * @returns {(null | object)} Parent control object or null if control is top level or cannot be found.
 */
export function findParentByChildId(controlId, controls) {
  function fpr(id) {
    return (r, x) => {
      if (x.type === 'group') {
        if (x.children.some((child) => child.id === id)) {
          return [x, ...r];
        }
        return [...x.children.reduce(fpr(id), []), ...r];
      }
      return r;
    };
  }

  const [result] = controls.reduce(fpr(controlId), []);
  return result || null;
}

/**
 * _Get a top level list of groups in a nested controls list
 * @param {[{}]} controls a nested list of control objects
 * @returns {[{}]} List of groups and their children
 */
export function getGroups(controls) {
  function reducer(r, x) {
    // console.log(i, r);
    if (x.type === 'group') {
      // return [x, ...r];
      return [...x.children.reduce(reducer, []), x, ...r];
    }
    return r;
  }

  return controls.reduce(reducer, []);
}

/**
 *
 * @param {[{}]} controls a nested list of control objects
 * @param {object} options
 * @param {string} options.type control type to modify, if blank then it will apply the replacer function to all question types
 * @param {string} options.key control key to modify,
 * @param {function({})} options.replacer function to replace the value for the control's key.
 *    takes the control as an argument and returns the replacement value
 */
export function updateControls(
  controls = [],
  options = {
    replacer: () => null,
  }
) {
  // equivalent to doing `obj = newObj`, mutating the original object, without reassigning it
  function mutateObj(left, newVal) {
    Object.keys(left).forEach((k) => {
      // eslint-disable-next-line no-param-reassign
      delete left[k];
    });
    Object.entries(newVal).forEach(([k, v]) => {
      // eslint-disable-next-line no-param-reassign
      left[k] = v;
    });
  }

  function modify({ type, key, replacer }) {
    return (control) => {
      if (control.type === type || (type instanceof RegExp && type.test(control.type))) {
        if (key) {
          set(control, key, replacer(control));
        } else {
          mutateObj(control, replacer(control));
        }
      } else if (control.type === 'group' && control.children.length) {
        control.children.forEach(modify({ type, key, replacer }));
      }
    };
  }

  const copy = cloneDeep(controls);
  copy.forEach(modify(options));
  return copy;
}

/**
 * Creates initial survey definition object
 * @param {object} options configuration object
 * @param {object} options.group
 * @param {object} options.group.id group id
 * @param {object} options.group.path group path
 * @param {number} options.specVersion specification version for survey definition
 */
export function createSurvey({ creator = null, group = null, specVersion = SPEC_VERSION_SURVEY }) {
  const currentDate = new Date().toISOString();
  return {
    _id: '',
    name: '',
    latestVersion: 1,
    meta: {
      dateCreated: currentDate,
      dateModified: currentDate,
      submissions: 'public',
      creator,
      group,
      specVersion,
      printOptions: {
        showInstruction: true,
        showUnanswered: false,
      },
      reviewPage: false,
    },
    resources: [],
    revisions: [
      {
        dateCreated: currentDate,
        version: 1,
        controls: [],
      },
    ],
  };
}

function hasPage(reduction, control) {
  if (control && control.children && Array.isArray(control.children)) {
    return control.children.reduce(hasPage, reduction) || control.type === 'page';
  } else if (control && control.type === 'page') {
    return true;
  }
  return false;
}

export const descendantHasPage = (control) => {
  return hasPage(false, control);
};

export const calcSurveySizeMB = (survey) => {
  const size = new TextEncoder().encode(JSON.stringify(survey)).length;
  const kiloBytes = size / 1024;
  const megaBytes = kiloBytes / 1024;
  return Math.round(megaBytes * 10) / 10;
};
