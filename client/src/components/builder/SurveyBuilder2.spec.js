import { render } from '@testing-library/vue';
import SurveyBuilder from './SurveyBuilder.vue';
import { createSurvey } from '@/utils/surveys';
import { createStoreObject } from '@/store';
import router from '@/router';

test('properly handles v-model', async () => {
  const survey = { ...createSurvey({ group: { id: null, path: null } }), name: 'survey name', id: 'survey_id' };
  const props = { survey };
  const { getByLabelText, getByText, findByDisplayValue } = render(SurveyBuilder, {
    props,
    router,
    store: createStoreObject(),
  });

  // Asserts initial state.
  await findByDisplayValue('survey name');
});
