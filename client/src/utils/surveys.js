/* eslint-disable no-mixed-operators */
/* eslint-disable no-new-func */
/* eslint-disable no-bitwise */

import { unflatten } from 'flat';
import { clone, cloneDeep, set } from 'lodash';
import moment from 'moment';
import submissionUtils from './submissions';
import { SPEC_VERSION_SURVEY } from '@/constants';
import supplySandbox from './supplySandbox';
import ObjectID from 'bson-objectid';

function* processSurveyNames(data) {
  if (!data) {
    return;
  }

  for (let i = 0; i < data.length; i++) {
    const val = data[i];
    yield val.name;

    if (val.children) {
      yield* processSurveyNames(val.children);
    }
  }
}

function* processSurveyNamesFull(data, namespace = '') {
  if (!data) {
    return;
  }

  for (let i = 0; i < data.length; i++) {
    const val = data[i];
    yield `${namespace === '' ? '' : `${namespace}.`}${val.name}`;

    if (val.children) {
      yield* processSurveyNamesFull(val.children, `${namespace === '' ? '' : `${namespace}.`}${val.name}`);
    }
  }
}

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

// inspired by
// https://derickbailey.com/2015/07/19/using-es6-generators-to-recursively-traverse-a-nested-data-structure/
function* processData(data, namespace = '') {
  if (!data) {
    return;
  }

  for (let i = 0; i < data.length; i++) {
    const val = data[i];
    yield {
      [`${namespace === '' ? '' : `${namespace}.`}${val.name}`]: val.value,
    };

    if (val.children) {
      yield* processData(val.children, `${namespace === '' ? '' : `${namespace}.`}${val.name}`);
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
 * Returns new controls copied from library survey
 * @param librarySurvey
 * @param newResources an array of resources containing updated id's, with the old id stored in the origin property
 * @returns [controls]
 */
export const getPreparedLibraryControls = (librarySurvey, newResources) => {
  return librarySurvey.revisions[librarySurvey.latestVersion - 1].controls.map((controlToAdd) => {
    changeRecursive(controlToAdd, (control) => {
      prepareToAddFromLibrary(control, librarySurvey._id, librarySurvey.latestVersion);
      replaceResourceReferenceId(control, newResources);
    });
    return controlToAdd;
  });
};

/**
 * Updates a control's references to resources
 * @param control the control to update
 * @param newResources an array of resources containing updated id's, with the old id stored in the origin property
 * @returns [controls]
 */
export const replaceResourceReferenceId = (control, newResources) => {
  if (newResources && control && control.options && control.options.source) {
    if (control.type === 'matrix') {
      control.options.source.content.forEach((col) => {
        if (col.resource) {
          let matchingResource = newResources.find((r) => r.origin === col.resource);
          if (matchingResource) {
            col.resource = matchingResource.id; // replace the control's reference by the new id of the resource
          }
        }
      });
    } else {
      let matchingResource = newResources.find((r) => r.origin === control.options.source);
      if (matchingResource) {
        control.options.source = matchingResource.id; // replace the control's reference by the new id of the resource
      }
    }
  }
};

/**
 * Returns a data object with keys and values from the instance controls.
 * e.g.
 *  instance = {data: [{name: "msg", value: "hello"}, {name: "age", value: 30}], ...}
 *  =>
 *  instanceData = {msg: "hello", age: 30}
 * @param {Object} instance
 *
 * @returns {Object} Object with keys and values
 */
export const getInstanceData = (instance) => {
  const it = processData(instance.data);
  let res = it.next();
  const objects = [];
  while (!res.done) {
    objects.push(res.value);
    res = it.next();
  }

  const c = Object.assign({}, ...objects);

  const u = unflatten(c, { safe: true });
  return u;
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

export const getSurveyPositions = (survey, version = 1) => {
  const positions = getControlPositions(survey.revisions.find((revision) => revision.version === version).controls);
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

  /*
  position.forEach((i) => {
    control = currentControls[i];
    currentControls = control.children;
    if (control.type === 'page') {
      break;
    }
  });
  */

  // eslint-disable-next-line no-restricted-syntax
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

  return flatName.substr(1);
};

export const insertControl = (controlToInsert, controls, position, selectedControlIsGroup) => {
  let currentControl;
  let currentControls = controls;
  let index = position[0];

  let exit = false;

  for (let i = 0; i < position.length; i++) {
    currentControl = currentControls[position[i]];
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

export const getBreadcrumbs = (survey, position) => {
  const breadcrumbs = [];
  let { controls } = survey;
  position.forEach((i) => {
    breadcrumbs.push(controls[i].label);
    controls = controls[i].children;
  });

  return breadcrumbs;
};

export const getInstanceIndex = (survey, position) => {
  const breadcrumbs = [];
  let { controls } = survey;
  position.forEach((i) => {
    breadcrumbs.push(controls[i].name);
    controls = controls[i].children;
  });

  return breadcrumbs.join('.');
};

function objectFromChild(child) {
  const v = {};
  if (child.type !== 'group') {
    v[`${child.name}`] = child.value || null;
    return v;
  }

  v[`${child.name}`] = Object.assign({}, ...child.children.map((c) => objectFromChild(c)));
  return v;
}

export const codeFromSubmission = (submission) => {
  const values = Object.assign({}, ...submission.data.map((d) => objectFromChild(d)));
  return values;
};

export const uuid = () => {
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
  return `${u}.${new Date().getTime().toString(16)}`;
};

// eslint-disable-next-line no-unused-vars
function _has(target, key) {
  return true;
}

function _get(target, key) {
  if (key === Symbol.unscopables) return undefined;
  return target[key];
}

export function compileSandboxSingleLine(src) {
  const wrappedSource = `with (sandbox) { return ${src}}`;
  const code = new Function('sandbox', wrappedSource);

  return function(sandbox) {
    const sandboxProxy = new Proxy(sandbox, { _has, _get });
    return code(sandboxProxy);
  };
}

export function compileSandbox(src, fname) {
  const wrappedSource = `with (sandbox) { ${src}\nreturn ${fname}(arg1, arg2, arg3); }`;
  const code = new Function('sandbox', wrappedSource);

  return function(sandbox) {
    const sandboxProxy = new Proxy(sandbox, { _has, _get });
    return code(sandboxProxy);
  };
}

export const handleize = (str) => {
  const handle = str && str.toLowerCase().replace(/\s/gi, '-');
  return handle;
};

export const simplify = (submissionItem) => {
  if (submissionItem.meta !== undefined && submissionItem.meta.type !== 'group') {
    return submissionItem.value || null;
  }

  const ret = {};
  const keys = Object.keys(submissionItem).filter((k) => k !== 'value' && k !== 'meta');
  keys.forEach((k) => {
    ret[k] = simplify(submissionItem[k]);
  });
  return ret;
};

export function executeUnsafe({ code, fname, submission, survey, parent, log }) {
  console.log('execute unsafe called');
  const sandbox = compileSandbox(code, fname);

  const res = sandbox({
    arg1: submission,
    arg2: survey,
    arg3: parent,
    log,
    ...supplySandbox,
  });

  return res;
}

export function execute({ code, fname, submission, log, survey, parent }) {
  console.log('execute safe called');
  const worker = new Worker('/worker.js');

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error('timeout'));
    }, 10000);

    let counter = 0;

    worker.onmessage = (m) => {
      console.log('message from worker', m, m.data);
      if (m.data.res !== undefined) {
        clearTimeout(timeout);
        worker.terminate();
        resolve(m.data.res);
      } else if (m.data.error) {
        clearTimeout(timeout);
        worker.terminate();
        reject(m.data.error);
      } else if (m.data.log) {
        if (counter++ > 1000) {
          reject(new Error('Too many log messages'));
        } else {
          const arg = typeof m.data.log === 'object' ? JSON.stringify(m.data.log, null, 2) : m.data.log;
          if (log) {
            log(arg);
          }
        }
      }
    };

    worker.postMessage({
      fname,
      arg1: submission,
      arg2: survey,
      arg3: parent,
      code,
    });
  });
}

// TOOD: decide how to do business logic on Survey and Survey instances
// Use a class? or helper function in here?
export const calculateControl = (control) => {
  if (!control.calculate || control.calculate === '') {
    // TODO
  }
};

const firstParentWithRelevance = (submission, survey, index, positions) => {
  const pos = clone(positions[index]);
  const len = pos.length - 1;
  const parts = [];
  parts.push(clone(pos));
  for (let i = 0; i < len; i++) {
    // swim to the top
    pos.splice(-1, 1);
    parts.push(clone(pos));
  }
  parts.reverse();
  const relevantParent = parts.find((p) => {
    const field = submissionUtils.getSubmissionField(submission, survey, p);
    return field.meta.relevant === false;
  });

  return relevantParent;
};

export const isRelevant = (submission, survey, index, positions) => {
  const relevantPosition = firstParentWithRelevance(submission, survey, index, positions) || positions[index];
  const field = submissionUtils.getSubmissionField(submission, survey, relevantPosition);
  return field.meta.relevant;
};

export const createQueryList = (survey, version = 1) => {
  const { controls } = survey.revisions.find((revision) => revision.version === version);
  const positions = getControlPositions(controls);
  const items = [];
  positions.forEach((position) => {
    const control = getControl(controls, position);
    if (control.type !== 'group') {
      const flatName = getFlatName(controls, position);
      items.push({ name: flatName, key: `data.${flatName}.value`, type: control.type });
    }
  });
  return items;
};

export const mockSurvey = {
  _id: '5dadc4c9988f9df9527f07ac',
  name: 'Generations Survey',
  controls: [
    {
      name: 'name',
      label: 'What is your name?',
      type: 'string',
      options: {
        readOnly: false,
        required: false,
        relevance: '',
        constraint: '',
        calculate: '',
      },
    },
    {
      name: 'age',
      label: 'What is your age?',
      type: 'number',
      options: {
        readOnly: false,
        required: false,
        relevance: '',
        constraint: '',
        calculate: '',
      },
    },
    {
      name: 'group_old',
      label: 'Old group',
      type: 'group',
      children: [
        {
          name: 'medication',
          label: 'What medication do you use?',
          type: 'text',
          options: {
            readOnly: false,
            required: false,
            relevance: '',
            constraint: '',
            calculate: '',
          },
        },
        {
          name: 'physical',
          label: 'My group 2',
          type: 'group',
          children: [
            {
              name: 'vision',
              label: 'What is your vision?',
              type: 'number',
              options: {
                readOnly: false,
                required: false,
                relevance: '',
                constraint: '',
                calculate: '',
              },
            },
            {
              name: 'time_mile',
              label: 'How long do run one mile?',
              type: 'string',
              options: {
                readOnly: false,
                required: false,
                relevance: '',
                constraint: '',
                calculate: '',
              },
            },
          ],
          options: {
            readOnly: false,
            required: false,
            relevance: '',
            constraint: '',
            calculate: '',
          },
        },
      ],
      options: {
        readOnly: false,
        required: false,
        relevance: '',
        constraint: '',
        calculate: '',
      },
    },
    {
      name: 'group_young',
      label: 'My group 5',
      type: 'group',
      children: [
        {
          name: 'sports',
          label: 'What sports do you watch?',
          type: 'string',
          options: {
            readOnly: false,
            required: false,
            relevance: '',
            constraint: '',
            calculate: '',
          },
        },
        {
          name: 'consoles',
          label: 'Which consoles do you own?',
          type: 'string',
          options: {
            readOnly: false,
            required: false,
            relevance: '',
            constraint: '',
            calculate: '',
          },
        },
      ],
      options: {
        readOnly: false,
        required: false,
        relevance: '',
        constraint: '',
        calculate: '',
      },
    },
    {
      name: 'goodbye',
      label: 'Say goodbye',
      type: 'string',
      options: {
        readOnly: false,
        required: false,
        relevance: '',
        constraint: '',
        calculate: '',
      },
    },
  ],
};

const mockInstance = {
  _id: '5dadc4c9988f9df9527f99ef',
  survey: '5dadc4c9988f9df9527f07ac',
  data: [
    {
      name: 'hello',
      label: 'How do you say hello?',
      type: 'string',
      value: 'Grüezi',
    },
    {
      name: 'personal_stuff',
      label: 'My group 2',
      type: 'group',
      children: [
        {
          name: 'text_0',
          label: 'Enter some text 0',
          type: 'string',
          value: 'This is completely random',
        },
        {
          name: 'group_0',
          label: 'My group 0',
          type: 'group',
          children: [
            {
              name: 'numeric_1',
              label: 'Enter a number 1',
              type: 'number',
              value: 17,
            },
          ],
        },
      ],
    },
  ],
};
const DBG = false;

if (DBG) {
  console.log();
  console.log('Processing instance:');
  const instanceData = getInstanceData(mockInstance);
  console.log(instanceData);
}

if (DBG) {
  console.log();
  console.log('Pocessing names:');
  const it = processSurveyNames(mockSurvey.controls);
  let res = it.next();
  while (!res.done) {
    console.log(res.value);
    res = it.next();
  }
}

if (DBG) {
  console.log();
  console.log('Pocessing names full:');
  const it = processSurveyNamesFull(mockSurvey.controls);
  let res = it.next();
  while (!res.done) {
    console.log(res.value);
    res = it.next();
  }
}

if (DBG) {
  console.log();
  console.log('Processing positions:');
  const it = processPositions(mockSurvey.controls);
  let res = it.next();
  while (!res.done) {
    console.log(res.value);
    res = it.next();
  }
}

if (DBG) {
  console.log();
  console.log('Pocessing jsDoc:');
  const it = processJsDoc(mockSurvey.controls);
  let res = it.next();
  while (!res.done) {
    console.log(res.value);
    res = it.next();
  }
}

/**
 * Finds the control object given a control's id and a nested list of controls
 * @param {string} controlId - The ObjectID string for the control to find.
 * @param {array} controls - The nested controls array to search through.
 * @returns {(null | object)} Control object or null if control cannot be found.
 */
export function findControlById(controlId, controls) {
  function reducer(id) {
    return (r, x) => {
      if (x.id === id) {
        return [x, ...r];
      }
      if (x.type === 'group') {
        return [...x.children.reduce(reducer(id), []), ...r];
      }
      return r;
    };
  }

  const [result] = controls.reduce(reducer(controlId), []);
  return result || null;
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
  const currentDate = moment().toISOString(true);
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
