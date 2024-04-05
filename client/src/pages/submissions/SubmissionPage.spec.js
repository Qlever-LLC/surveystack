import { renderWithVuetify } from '../../../tests/renderWithVuetify';
import SubmissionPage from './SubmissionPage.vue';
import { createSurvey } from '@/utils/surveys';
import { createSubmissionFromSurvey } from '@/utils/submissions';
import { addRevisionToSurvey, createControl } from '@/../tests/surveyTestingUtils';
import api from '@/services/api.service';
import ObjectID from 'bson-objectid';

jest.mock('@/services/api.service');

function mockSurvey() {
  const survey = {
    ...createSurvey({ group: { id: new ObjectID(), path: null } }),
  };
  const controls = [createControl({ type: 'number', id: '1' }), createControl({ type: 'number', id: '2' })];
  addRevisionToSurvey(survey, controls);
  return survey;
}

function mockSubmission(survey) {
  return createSubmissionFromSurvey({ survey, version: survey.latestVersion });
}

describe('Draft', () => {
  it('does not throw for relevance expression when submission data key is missing', async () => {
    const survey = mockSurvey();
    survey.revisions[1].controls[0].name = 'number_1';
    survey.revisions[1].controls[1].name = 'number_2';
    survey.revisions[1].controls[0].options.relevance.code = `function relevance(submission) { return !!submission.data.number_2.value; }`;
    survey.revisions[1].controls[0].options.relevance.enabled = true;
    const badSubmission = {
      ...mockSubmission(survey),
      data: {},
    };

    api.get.mockResolvedValue({ data: survey });

    renderWithVuetify(SubmissionPage, {
      global: {
        mocks: {
          $route: {
            params: {
              id: survey.meta.group.id,
              surveyId: survey._id,
              submissionId: badSubmission._id,
            },
            query: {},
            path: '',
            name: 'group-survey-submissions-edit',
          },
          $store: {
            actions: {
              'submissions/fetchLocalSubmission': jest.fn(() => ({ ...badSubmission })),
              'submissions/fetchLocalSubmissions': jest.fn(),
              'appui/reset': jest.fn(),
              'surveys/fetchSurvey': jest.fn(() => ({ ...survey })),
              'resources/fetchResources': jest.fn().mockResolvedValue([]),
              'memberships/getUserMemberships': jest.fn().mockResolvedValue([]),
            },
            getters: {
              'auth/user': {},
              'auth/isLoggedIn': true,
              'memberships/groups': [],
              'submissions/getSubmission': () => ({ ...badSubmission }),
            },
            dispatch: jest.fn(),
          },
        },
      },
    });
    // This test doesn't fail correctly without setTimeout
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
});
