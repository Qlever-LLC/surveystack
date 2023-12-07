import { createControlInstance } from '@/utils/surveyConfig';
import { uniqueId } from 'lodash';

export const addRevisionToSurvey = (survey, controls) => {
  if (!Array.isArray(controls)) {
    throw new Error('controls must be an array');
  }
  const revision = {
    version: survey.revisions.length + 1,
    controls,
  };
  survey.revisions.push(revision);
  survey.latestVersion = revision.version;
  return revision;
};

export const createControl = ({ type, ...overrides }) => {
  const control = {
    ...createControlInstance({ type }),
    name: `${type}_${uniqueId()}`,
    children: ['page', 'group'].includes(type) ? [] : undefined,
    ...overrides,
  };
  control.options = { ...control.options, ...(overrides.options || {}) };
  return control;
};
