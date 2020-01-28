/* eslint-disable valid-typeof */

const types = {
  control: 'object',
  eval: 'function',
  changed: 'function',
};

export default function (control) {
  const keys = Object.keys(types);
  return keys.every(k => typeof control[k] === types[k]);
}
