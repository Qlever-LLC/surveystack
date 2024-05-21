import { createSurvey } from '@/utils/surveys';
import { createSubmissionFromSurvey, fetchSubmissionUniqueItems } from './submissions';
import api from '@/services/api.service';

jest.mock('@/services/api.service');
api.get.mockImplementation(() => {
  return {
    data: [
      {
        _id: '60bfc84cfc482000010a3099',
        data: {
          checkboxes_1: {
            value: ['cat'],
          },
        },
      },
      {
        _id: '60bfc41ae47e630001bbb41e',
        data: {
          checkboxes_1: {
            value: ['cat'],
          },
        },
      },
      {
        _id: '60afbdf7ac16af0001203bfd',
        data: {
          checkboxes_1: {
            value: ['cat', 'dog'],
          },
        },
      },
      {
        _id: '60afbde7ac16af0001203bfc',
        data: {
          checkboxes_1: {
            value: ['cat', 'dog'],
          },
        },
      },
      {
        _id: '60afbdd4ac16af0001203bfb',
        data: {
          checkboxes_1: {
            value: ['cat', 'dog'],
          },
        },
      },
    ],
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {
      url: '/api/submissions?survey=60afbd3eac16af0001203bba&project={"data.checkboxes_1.value":1}',
      method: 'get',
      headers: {},
      baseURL: '/api',
    },
    request: {},
  };
});

describe('createSubmissionFromSurvey', () => {
  it('creates a submission from the given survey version', () => {
    const survey = createSurvey({ group: { id: 'group-id', path: '/group-path' } });
    const submission = createSubmissionFromSurvey({ survey, version: survey.latestVersion });
    expect(submission.meta.survey.id).toEqual(survey._id);
    expect(submission.meta.group.id).toEqual(survey.meta.group.id);
    expect(submission.meta.isDraft).toBe(true);
    expect(submission.meta.isDeletedDraft).toBe(false);
    expect(submission.meta.specVersion).toBe(4);
  });
});

describe('fetchSubmissionUniqueItems', () => {
  it('returns unique string items from the all submissions for the given survey', async () => {
    const items = await fetchSubmissionUniqueItems('my-survey-id', 'data.checkboxes_1');
    expect(items[0].label).toBe('cat');
    expect(items[0].count).toBe(5);
    expect(items[1].label).toBe('dog');
    expect(items[1].count).toBe(3);
  });
});
