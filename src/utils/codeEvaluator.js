import * as utils from './surveys';
import submissionUtils from './submissions';


async function calculateField(survey, submission, positions, controls, option, fname) {
  const items = positions.map((pos) => {
    const control = utils.getControl(controls, pos);
    if (!control.options[option].enabled) {
      return null;
    }
    const { code } = control.options[option];
    return {
      pos,
      control,
      code,
    };
  }).filter(item => item !== null);


  const promises = items.map(item => new Promise((resolve, reject) => {
    utils.execute({ code: item.code, fname, submission })
      .then(r => resolve({
        control: item.control,
        pos: item.pos,
        res: r,
      })).catch((e) => {
        reject(e);
      });
  }));


  const evaluated = [];
  try {
    const res = await Promise.all(promises);
    res.forEach((item) => {
      const field = submissionUtils.getSubmissionField(submission, survey, item.pos);
      const evaluatedItem = {
        field,
        res: item.res,
      };

      evaluated.push(evaluatedItem);
    });
  } catch (error) {
    console.log(error);
  }

  return evaluated;
}

export const calculateRelevance = async (survey, submission, positions, controls) => {
  const r = await calculateField(survey, submission, positions, controls, 'relevance', 'relevance');
  r.forEach((item) => {
    if (typeof item.res !== 'boolean') {
      console.log('error, result is rejected', item.res);
    }
    // eslint-disable-next-line no-param-reassign
    item.field.meta.relevant = item.res;
  });
};


export const calculateApiCompose = async (survey, submission, positions, controls) => {
  const r = await calculateField(survey, submission, positions, controls, 'apiCompose', 'apiCompose');
  r.forEach((item) => {
    if (typeof item.res !== 'object') {
      console.log('error, result is rejected', item.res);
    }
    // eslint-disable-next-line no-param-reassign
    item.field.meta.apiCompose = item.res;
  });
};
