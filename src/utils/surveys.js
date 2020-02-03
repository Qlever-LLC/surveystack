/* eslint-disable no-mixed-operators */
/* eslint-disable no-new-func */
/* eslint-disable no-bitwise */


import { unflatten } from 'flat';
import ObjectID from 'bson-objectid';

import _ from 'lodash';

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
      yield* processSurveyNamesFull(
        val.children,
        `${namespace === '' ? '' : `${namespace}.`}${val.name}`,
      );
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

    yield `@param {${type}} ${namespace === '' ? namespace : `${namespace}.`}${
      val.name
    }`;

    if (val.children) {
      yield* processJsDoc(
        val.children,
        `${namespace === '' ? namespace : `${namespace}.`}${val.name}`,
      );
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
      yield* processData(
        val.children,
        `${namespace === '' ? '' : `${namespace}.`}${val.name}`,
      );
    }
  }
}

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
  const positions = getControlPositions(survey.versions.find(item => item.version === version).controls);
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

  const doc = annotations.map(annotation => ` * ${annotation}`).join('\n');

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
  // let { controls } = survey;
  position.forEach((i) => {
    control = currentControls[i];
    currentControls = control.children;
  });

  if (control.type !== 'group') {
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

export const insertControl = (control, controls, position) => {
  let currentControl;
  let currentControls = controls;
  let index = position[0];


  for (let i = 0; i < position.length; i++) {
    currentControl = currentControls[position[i]];
    index = position[i];
    if (currentControl.type === 'group') {
      if (i === position.length - 1) {
        break;
      }
      currentControls = currentControl.children;
    }
  }

  currentControls.splice(index + 1, 0, control);
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

export const getBreadcrumbsForSubmission = (controlsArg, position) => {
  let controls = controlsArg;
  const breadcrumbs = [];
  position.forEach((i) => {
    breadcrumbs.push(controls[i].name);
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

export const flattenSubmission = (submission) => {
  const res = {};
  const positions = getControlPositions(submission.data);
  positions.forEach((p) => {
    const control = getControl(submission.data, p);
    const breadcrumbs = getBreadcrumbsForSubmission(submission.data, p);
    if (control.type !== 'group') {
      const key = breadcrumbs.join('.');
      res[key] = {
        value: control.value,
        type: control.type,
      };
    }
  });
  return res;
};


export const linearControls = (submission) => {
  const res = [];
  const positions = getControlPositions(submission.data);
  positions.forEach((p) => {
    const control = getControl(submission.data, p);
    const breadcrumbs = getBreadcrumbsForSubmission(submission.data, p);
    if (control.type !== 'group') {
      const key = breadcrumbs.join('.');
      const r = Object.assign({
        breadcrumbs,
        key,
        number: p.map(value => value + 1),
        position: p,
      }, control);
      res.push(r);
    }
  });
  return res;
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
    return (r & 0x3 | 0x8).toString(16);
  });
  return `${u}.${new Date().getTime().toString(16)}`;
};

// eslint-disable-next-line no-unused-vars
function has(target, key) {
  return true;
}

function get(target, key) {
  if (key === Symbol.unscopables) return undefined;
  return target[key];
}

export function compileSandboxSingleLine(src) {
  const wrappedSource = `with (sandbox) { return ${src}}`;
  const code = new Function('sandbox', wrappedSource);

  return function (sandbox) {
    const sandboxProxy = new Proxy(sandbox, { has, get });
    return code(sandboxProxy);
  };
}

export function compileSandbox(src, fname) {
  const wrappedSource = `with (sandbox) { ${src}\nreturn ${fname}(data); }`;
  const code = new Function('sandbox', wrappedSource);

  return function (sandbox) {
    const sandboxProxy = new Proxy(sandbox, { has, get });
    return code(sandboxProxy);
  };
}


/**
 * Returns a new instance based off a specific survey version
 * @param {Object} survey
 * @param String version
 *
 * @returns {Object} An specifc survey version instance.
 */
export const createInstance = (survey, version = 1) => {
  const clone = _.cloneDeep(survey.versions.find(item => item.version === version));
  delete clone.dateCreated;

  clone._id = new ObjectID().toString();
  clone.survey = survey._id;
  clone.meta = {
    dateCreated: new Date(),
    version,
  };

  // rename "controls" to "data"
  // https://stackoverflow.com/a/50101979
  delete Object.assign(clone, { data: clone.controls }).controls;

  return clone;
};


/**
 * Returns a payload of an instance ready to upload to the server
 * @param {Object} instance
 *
 * @returns {Object} A representation of the instance ready for uploading to the server
 */
export const createInstancePayload = (instance) => {
  const clone = _.cloneDeep(instance);
  const positions = getControlPositions(instance.data);

  positions.forEach((position) => {
    const control = getControl(clone.data, position);
    delete control.label;
    delete control.options;
  });

  // TODO: may need to adapt dates

  return clone;
};

export const handleize = (str) => {
  const handle = str && str.toLowerCase().replace(/\s/gi, '-');
  return handle;
};

// TOOD: decide how to do business logic on Survey and Survey instances
// Use a class? or helper function in here?
export const calculateControl = (control) => {
  if (!control.calculate || control.calculate === '') {
    // TODO
  }
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
