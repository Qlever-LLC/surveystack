/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import submissionUtils from './submissions';
import * as surveyUtils from './surveys';
import * as surveyStackUtils from './surveyStack';


async function calculateField({
  nodes, submission, survey, option, fname,
}) {
  const items = nodes.map((node) => {
    const path = node.getPath().map(n => n.model.name).join('.');
    const control = node.model;
    const field = surveyStackUtils.getNested(submission, path);

    if (!control.options[option].enabled) {
      return {
        path,
        control,
        field,
        skip: true,
      };
    }

    // skip calculation if field was already computed as irrelevant
    if (fname !== 'relevance' && field.meta.computedRelevance !== undefined && field.meta.computedRelevance === false) {
      // TODO: may want to return null here too?
      return {
        path,
        control,
        field,
        skip: true,
      };
    }

    const { code } = control.options[option];
    return {
      path, control, field, code, skip: false,
    };
  });

  // execution
  for (const item of items) {
    if (item.skip) {
      continue; // eslint-disable-line no-continue
    }
    try {
      const result = surveyUtils.executeUnsafe({
        code: item.code, fname, submission, survey, log: msg => console.log(msg),
      });
      item.result = result;
    } catch (error) {
      item.error = error;
    }
  }

  return items;
}


export const calculateRelevance = async (nodes, submission, survey) => {
  const calculations = await calculateField({
    nodes, submission, survey, option: 'relevance', fname: 'relevance',
  });
  return calculations;
};

export const calculateApiCompose = async (nodes, submission, survey) => {
  const calculations = await calculateField({
    nodes, submission, survey, option: 'apiCompose', fname: 'apiCompose',
  });
  return calculations;
};
