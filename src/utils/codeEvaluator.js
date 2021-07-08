/* eslint-disable no-unreachable */
/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import * as surveyUtils from './surveys';
import * as surveyStackUtils from './surveyStack';

async function calculateField({ nodes, submission, survey, option, fname }) {
  const items = nodes.map((node) => {
    const path = node
      .getPath()
      .map((n) => n.model.name)
      .join('.');
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

    const relevant = surveyStackUtils.getRelevance(submission, path, true);
    // skip calculation if field was already computed as irrelevant
    if (fname !== 'relevance' && !relevant) {
      // TODO: may want to return null here too?
      return {
        path,
        control,
        field,
        skip: true,
        clear: true,
      };
    }

    const { code } = control.options[option];
    return {
      path,
      control,
      field,
      code,
      skip: false,
    };
  });

  // execution
  for (const item of items) {
    if (item.skip && item.clear) {
      item.result = null;
      continue; // eslint-disable-line no-continue
    } else if (item.skip) {
      continue; // eslint-disable-line no-continue
    }
    try {
      const parentPath = surveyStackUtils.getParentPath(item.path);
      const parentData = surveyStackUtils.getNested(submission, parentPath);
      const result = surveyUtils.executeUnsafe({
        code: item.code,
        fname,
        submission,
        survey,
        parent: parentData,
        log: (msg) => console.log(msg),
      });
      item.result = result;
    } catch (error) {
      item.error = error;
      console.log(error);
    }
  }

  return items;
}

export const calculateRelevance = async (nodes, submission, survey) => {
  const calculations = await calculateField({
    nodes,
    submission,
    survey,
    option: 'relevance',
    fname: 'relevance',
  });
  return calculations;
};

export const calculateApiCompose = async (nodes, submission, survey) => {
  const calculations = await calculateField({
    nodes,
    submission,
    survey,
    option: 'apiCompose',
    fname: 'apiCompose',
  });
  return calculations;
};
