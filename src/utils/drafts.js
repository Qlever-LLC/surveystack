import ObjectID from 'bson-objectid';
import _ from 'lodash';
import { unflatten } from 'flat';
import * as db from '@/store/db';
import { getSurveyPositions } from './surveys';


export const loadResults = () => new Promise((resolve, reject) => {
  db.openDb(() => {
    db.getAllSubmissions((results) => {
      if (!results || results.length === 0) {
        reject();
      } else {
        resolve(results);
      }
    });
  });
});

/**
 * Creates and returns a new submission based off a specific survey version
 * @param {Object} survey
 * @param String version
 *
 * @returns {Object} A submission for a specific survey version.
 */
export const createSubmissionFromSurvey = (survey, version = 1) => {
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


  const positions = getSurveyPositions(survey, version);

  /*
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
  */

  return clone;
};
