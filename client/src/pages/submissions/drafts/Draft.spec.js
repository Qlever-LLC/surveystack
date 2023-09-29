import { renderWithVuetify } from '../../../../tests/renderWithVuetify';
import Draft from './Draft.vue';
import router from '@/router';
import { createSurvey } from '@/utils/surveys';
import { createSubmissionFromSurvey } from '@/utils/submissions';
import draftStore from '@/store/modules/draft.store';
import { createLocalVue } from '@vue/test-utils';
import { addRevisionToSurvey, createControl } from '@/../tests/surveyTestingUtils';

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
  beforeEach(() => {
    // disable console.log vor this describe block
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });
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

    renderWithVuetify(Draft, {
      localVue,
      router: router,
      store: {
        actions: {
          'submissions/getDraft': jest.fn(() => ({ ...badSubmission })),
          'submissions/saveLocalDrafts': jest.fn,
          'appui/reset': jest.fn,
          'surveys/fetchSurvey': jest.fn(() => ({ ...survey })),
        },
        modules: { draft: draftStore },
      },
    });
    // This test doesn't fail correctly without setTimeout
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
});
