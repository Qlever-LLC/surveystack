/* eslint-disable valid-typeof */

const types = {
  control: 'object',
  eval: 'function',
  changed: 'function',
  showNav: 'function',
  hideNav: 'function',
  next: 'function',
};


export default {
  controlArgs: {
    type: Object,
    required: true,
    validator(control) {
      const keys = Object.keys(types);
      return keys.every(k => typeof control[k] === types[k]);
    },
  },
};
