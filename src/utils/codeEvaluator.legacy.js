/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import * as utils from './surveys';
import submissionUtils from './submissions';


async function calculateField(survey, submission, positions, controls, option, fname) {
  const ignored = [];
  const items = positions.map((pos) => {
    const control = utils.getControl(controls, pos);
    if (!control.options[option].enabled) {
      return null;
    }

    // in case the field is not relevant, skip execution and return {}
    const field = submissionUtils.getSubmissionField(submission, survey, pos);

    if (fname !== 'relevance') { // if field happens to be irrelvant, but skip this if we eval relevance
      if (field.meta.relevant !== undefined && field.meta.relevant === false) {
        ignored.push({
          control,
          field,
          ignore: true,
        });
        return null;
      }
    }

    const { code } = control.options[option];
    return {
      pos,
      control,
      code,
    };
  }).filter(item => item !== null);


  const evaluated = [];


  // eslint-disable-next-line no-restricted-syntax
  for (const item of items) {
    try {
      const res = {
        // TODO MH pass parent instead of null?
        res: utils.executeUnsafe({
          code: item.code, fname, submission, survey, null, log: msg => console.log(msg),
        }),
        pos: item.pos,
        control: item.control,
      };

      const field = submissionUtils.getSubmissionField(submission, survey, item.pos);
      const evaluatedItem = {
        control: item.control,
        field,
        res: res.res,
      };
      evaluated.push(evaluatedItem);
    } catch (error) {
      const field = submissionUtils.getSubmissionField(submission, survey, item.pos);
      const evaluatedItem = {
        control: item.control,
        field,
        error,
      };
      evaluated.push(evaluatedItem);
    }
  }

  evaluated.push(...ignored);

  return evaluated;
}

export const calculateRelevance = async (survey, submission, positions, controls) => {
  try {
    const r = await calculateField(survey, submission, positions, controls, 'relevance', 'relevance');
    r.forEach((item) => {
      if (typeof item.res !== 'boolean') {
        console.log('error, result is rejected', item);
        item.field.meta.relevant = true;
      } else {
        item.field.meta.relevant = item.res;
      }
    });

    // for all eval if relevant, store in field
    for (let idx = 0; idx < positions.length; idx++) {
      const pos = positions[idx];
      const rel = utils.isRelevant(submission, survey, idx, positions);
      const field = submissionUtils.getSubmissionField(submission, survey, pos);
      field.meta.computedRelevance = rel;
    }
  } catch (error) {
    console.log(error);
  }
};


export const calculateApiCompose = async (survey, submission, positions, controls) => {
  const r = await calculateField(survey, submission, positions, controls, 'apiCompose', 'apiCompose');
  r.forEach((item) => {
    if (typeof item.res !== 'object') {
      console.log('error, result is rejected', item.res);
    }
    if (item.ignore) {
      item.field.meta.apiCompose = {};
    } else {
      item.field.meta.apiCompose = item.res;
    }
  });
  return r;
};
