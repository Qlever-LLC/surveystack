import ObjectID from 'bson-objectid';
import { flatten, unflatten } from 'flat';
import cloneDeep from 'lodash/cloneDeep';
import groupBy from 'lodash/groupBy';
import * as constants from '@/constants';
import api from '@/services/api.service';
import { AuthService } from '@/services/storage.service';
import { get } from 'lodash';
import { getControlPositions, getControl, getFlatName } from './surveys';

const getBreadcrumbsForSubmission = (controls, position) => {
  let currentControls = controls;
  const breadcrumbs = [];
  position.forEach((i) => {
    breadcrumbs.push(currentControls[i].name);
    currentControls = currentControls[i].children;
  });

  return breadcrumbs;
};

/**
 * Creates and returns a new submission based off a specific survey version
 * @param {Object} survey
 * @param String version
 *
 * @returns {Object} A submission for a specific survey version.
 */
export const createSubmissionFromSurvey = ({
  survey,
  version = 1,
  instance,
  submitAsUser = undefined,
  isDraft = true,
}) => {
  const submission = {};
  const dateNow = new Date().toISOString();
  const currentUser = AuthService.getUser();
  const creator = currentUser._id || null;

  submission._id = new ObjectID().toString();
  submission.meta = {
    dateCreated: dateNow,
    dateModified: dateNow,
    dateSubmitted: null,
    isDraft,
    isDeletedDraft: false,
    survey: { id: survey._id, name: survey.name, version: version },
    revision: 1,
    permissions: [],
    status: [],
    group: {
      id: survey.meta.group.id,
      path: survey.meta.group.path,
    },
    specVersion: constants.SPEC_VERSION_SUBMISSION,
    submitAsUser: submitAsUser,
    creator,
  };

  // TODO: handle version not found
  const { controls } = survey.revisions.find((revision) => revision.version === version);
  const positions = getControlPositions(controls);

  let flattenedInstance;
  if (instance) {
    flattenedInstance = flatten(instance.data);
  }

  const objects = [];
  positions.forEach((position) => {
    const control = getControl(controls, position);
    const flatName = getFlatName(controls, position);
    let v = null;
    if (flattenedInstance) {
      const keys = Object.keys(flattenedInstance).filter((o) => o.startsWith(`${flatName}.value`));
      // regex to detect an array with only 1 element that should continue to be treated as an array
      let regex = /value\.\d+$/;
      if (keys.length === 1 && !regex.test(keys[0])) {
        // eslint-disable-next-line prefer-destructuring
        v = flattenedInstance[keys[0]];
      } else {
        // if this is an object
        const inner = {};
        // eslint-disable-next-line no-restricted-syntax
        for (const k of keys) {
          const len = `${flatName}.value`.length;
          const updatedKey = k.substring(len + 1); // '.' char
          inner[updatedKey] = flattenedInstance[k];
        }
        v = unflatten(inner);
      }
    }
    const dateModified = flattenedInstance ? flattenedInstance[`${flatName}.meta.dateModified`] : null;
    const meta = { type: control.type, dateModified };
    // add uuid: uuidv4(), if uuid

    if (control.options.redacted) {
      meta.permissions = ['admin'];
    }

    // Set control value by order of 1. original value (if set), 2. default value (if set), 3. null
    const entry = { value: v || control.defaultValue || null, meta };
    if (control.type === 'group' || control.type === 'page') {
      delete entry.value;
      delete entry.meta.dateModified;
    }

    objects.push({ [flatName]: entry });
  });

  const c = Object.assign({}, ...objects);
  submission.data = unflatten(c, { safe: true });
  return submission;
};

/**
 * Returns the object from submission's data corresponding to the current position in a survey
 * @param {Object} submission A submission entity
 * @param {Object} survey A survey entity
 * @param {Array} position The current position inside the survey
 *
 * @returns {Object} The nested object from submission's data
 */
export const getSubmissionField = (submission, survey, position) => {
  // TODO: handle version not found
  const { controls } = survey.revisions.find((revision) => revision.version === submission.meta.survey.version);

  const flatName = getFlatName(controls, position);
  const splits = flatName.split('.');

  let obj = submission.data;

  splits.forEach((key) => {
    obj = obj[key];
  });

  return obj;
};

export const linearControls = (survey, submission) => {
  const res = [];
  const { controls } = survey.revisions.find((revision) => revision.version === submission.meta.survey.version);
  const positions = getControlPositions(controls);
  positions.forEach((p) => {
    const control = cloneDeep(getControl(controls, p));
    const breadcrumbs = getBreadcrumbsForSubmission(controls, p);
    const submissionField = getSubmissionField(submission, survey, p);
    if (control.type !== 'group' && !!submissionField) {
      const key = breadcrumbs.join('.');
      const r = Object.assign(control, {
        breadcrumbs,
        key,
        number: p.map((value) => value + 1),
        position: p,
        value: submissionField.value,
        meta: submissionField.meta,
      });
      res.push(r);
    }
  });
  return res;
};

export const linearControlsWithGroups = (survey, submission) => {
  const res = [];
  const { controls } = survey.revisions.find((revision) => revision.version === submission.meta.survey.version);
  const positions = getControlPositions(controls);
  positions.forEach((p) => {
    const control = cloneDeep(getControl(controls, p));
    const breadcrumbs = getBreadcrumbsForSubmission(controls, p);
    const submissionField = getSubmissionField(submission, survey, p);
    if (!submissionField) {
      return;
    }

    const key = breadcrumbs.join('.');
    const r = Object.assign(control, {
      breadcrumbs,
      key,
      number: p.map((value) => value + 1),
      position: p,
      value: submissionField.value,
      meta: submissionField.meta,
    });
    res.push(r);
  });
  return res;
};

export async function fetchSubmissionUniqueItems(surveyId, path) {
  const query = `&project={"${path}.value":1}`;
  const { data } = await api.get(`/submissions?survey=${surveyId}${query}`);
  const items = data
    .map((item) => {
      const value = get(item, `${path}.value`, null);
      return {
        id: item._id,
        label: JSON.stringify(value).replace(/^"(.+(?="$))"$/, '$1'),
        value,
      };
    })
    .filter((item) => item.value !== null);

  const explodeItem = (item) =>
    item.value
      .map((v, i) => ({
        id: `${item.id}__${i}`,
        // stringify and remove wrapping quote characters so that strings are rendered without quotation marks
        label: JSON.stringify(v).replace(/^"(.+(?="$))"$/, '$1'),
        value: v,
      }))
      .filter((v) => v.value);

  const explodedItems = items.flatMap((it) => (Array.isArray(it.value) ? explodeItem(it) : [it]));
  const uniqueItems = Object.values(groupBy(explodedItems, 'label')).map((group) => ({
    ...group[0],
    label: group[0].label,
    count: group.length,
  }));

  return uniqueItems;
}

export const isGroupMember = (survey, userGroups) => userGroups.some((group) => group._id === survey.meta.group.id);
export const isGroupMemberOfGroupOrDescendant = (survey, userGroups) => userGroups.some((group) => survey.meta.group.path.startsWith(group.path));

export const checkAllowedToSubmit = (survey, isLoggedIn, userGroups, submitToGroupId) => {
  const { submissions, isLibrary } = survey.meta;

  if (isLibrary) {
    return {
      allowed: false,
      message: 'This is a library survey, please choose another survey to submit.',
    };
  }

  // REMOVED this due to performance issues => have to load survey.revision => heavy for this edge case !
  /*
  const publishedVersion = survey.revisions.find((revision) => revision.version === survey.latestVersion);
  const isPublishedVersionEmpty = publishedVersion.controls.length === 0;
  if (isPublishedVersionEmpty) {
    return {
      allowed: false,
      message:
        'The latest published version of this survey is empty. Please publish a new version to start a submission.',
    };
  }
    */

  switch (submissions) {
    case 'groupAndDescendants': {
      if (!isLoggedIn) {
        return { allowed: false, message: 'You must be logged in to submit this survey.' };
      }

      console.log('userGroups', userGroups.map((group) => group._id));
      console.log('submitToGroupId', submitToGroupId);
      const isMemberOfSubmitToGroup = userGroups.some(
        (group) => group._id === submitToGroupId
      );
      console.log('isMemberOfSubmitToGroup', isMemberOfSubmitToGroup);
      return isGroupMemberOfGroupOrDescendant(survey, userGroups)
        && isMemberOfSubmitToGroup
        ? {
            allowed: true,
          }
        : {
            allowed: false,
            message: 'You must be a member of the group or a descendant group to submit this survey.',
          };
    }
    case 'group': {
      if (!isLoggedIn) {
        return { allowed: false, message: 'You must be logged in to submit this survey.' };
      }
      return isGroupMember(survey, userGroups)
        ? {
            allowed: true,
          }
        : {
            allowed: false,
            message: 'You must be a member of the group to submit this survey.',
          };
    }
    case 'public':
    case null:
    case undefined:
      return { allowed: true };
  }

  return { allowed: false, message: 'You are not authorized to submit this survey.' };
};

/**
 * Retrieves the group IDs for the surveys associated with the given submissions.
 * @param {Array} submissions - An array of submission objects.
 * @returns {Object} An object mapping survey IDs to group IDs.
 */
export async function getSubmissionSurveyGroupIds(submissions) {
  const surveyIds = submissions.map((s) => s.meta.survey.id);
  console.log('submissions', submissions, surveyIds);
  const surveyPromises = surveyIds.map(
    (id) => api.get(`/surveys?q=${id}&projections[]=meta.group.id`)
  );
  const results = await Promise.all(surveyPromises);
  const groupIdBySurveyId = Object.fromEntries(
    results.map((s) => [s.data[0]._id, s.data[0].meta.group.id])
  );
  console.log('groupIdBySurveyId', groupIdBySurveyId);
  return groupIdBySurveyId;
}

/**
 * Decorates the submissions with their corresponding survey group IDs.
 * @param {Array} submissions - An array of submission objects.
 * @param {Object} groupIdBySurveyId - An object mapping survey IDs to group IDs.
 * @returns {Array} An array of decorated submission objects.
 */
export function decorateSubmissionsWithSurveyGroupIds(submissions, groupIdBySurveyId) {
  return submissions.map((s) => {
    return { 
      ...s, 
      meta: { 
        ...s.meta, 
        survey: { 
          ...s.meta.survey, 
          meta: { 
            group: { 
              id: groupIdBySurveyId[s.meta.survey.id] 
            } 
          } 
        } 
      } 
    };
  });
}
