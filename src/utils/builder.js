/* eslint-disable import/prefer-default-export */
export const convertToKey = (str) => {
  const key = str.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_$/, '').replace(/^_/, '');
  return key;
};
