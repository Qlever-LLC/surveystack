const Data = {
  action: {
    value: null,
    meta: {
      type: 'selectMultiple',
      dateModified: null,
    },
  },
};

/*
According to "Documenting a destructuring parameter" from
https://jsdoc.app/tags-param.html#parameters-with-properties

/**
 * Relevance
 *
 * @param {Object} params - An object.
 * @param {Data} params.data - Data.
 */
function relevance({ data }) {
  return data.action.value > 10; // <=== autocomplete works for data.*
}
