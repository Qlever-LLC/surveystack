import { renderWithVuetify } from '../../../tests/renderWithVuetify';
import SubmissionPage from './SubmissionPage.vue';
import { createSurvey } from '@/utils/surveys';
import { createSubmissionFromSurvey } from '@/utils/submissions';
import draftStore from '@/store/modules/draft.store';
import { createLocalVue } from '@vue/test-utils';
import { addRevisionToSurvey, createControl } from '@/../tests/surveyTestingUtils';
import api from '@/services/api.service';

jest.mock('@/services/api.service');

function mockSurvey() {
  const survey = {
    ...createSurvey({ group: { id: null, path: null } }),
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

    const AppControlNumberStub = {
      render(h) {
        return h('span', this.$slots.default);
      },
    };

    const localVue = createLocalVue();
    localVue.component('AppControlNumber', AppControlNumberStub);

    api.get.mockResolvedValue({ data: survey });

    renderWithVuetify(SubmissionPage, {
      localVue,
      mocks: {
        $route: {
          params: {
            surveyId: survey._id,
            submissionId: badSubmission._id,
          },
          query: {},
          path: '',
          name: 'edit-submission',
        },
      },
      store: {
        actions: {
          'submissions/fetchLocalSubmissions': jest.fn(),
          'appui/reset': jest.fn(),
          'surveys/fetchSurvey': jest.fn(() => ({ ...survey })),
          'resources/fetchResources': jest.fn().mockResolvedValue([]),
          'memberships/getUserMemberships': jest.fn().mockResolvedValue([]),
        },
        getters: {
          'auth/user': () => ({}),
          'auth/isLoggedIn': () => true,
          'memberships/groups': () => [],
          'submissions/getSubmission': () => () => ({ ...badSubmission }),
        },
        modules: { draft: draftStore },
      },
    });
    // This test doesn't fail correctly without setTimeout
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
});
