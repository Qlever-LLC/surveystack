import { render, fireEvent, prettyDOM, findByText, getByTestId, getByLabelText, within } from '@testing-library/vue';
import SurveyBuilder from './SurveyBuilder.vue';
import { createSurvey } from '@/utils/surveys';
import { createStoreObject } from '@/store';
import vuetify from '@/plugins/vuetify';
import { availableControls, createControlInstance } from '@/utils/surveyConfig';
import router from '@/router';
import { isString, last } from 'lodash';
import '@/components/survey/question_types';

// Example test  with vue-testing-utils
import { mount } from '@vue/test-utils';
import Vuex from 'vuex';
import SurveyNameEditor from '@/components/builder/SurveyNameEditor.vue';
test('vue-test-utils example', () => {
  const survey = { ...createSurvey({ group: { id: null, path: null } }), name: 'survey name', id: 'survey_id' };
  const propsData = { survey };
  const store = new Vuex.Store(createStoreObject());
  const wrapper = mount(SurveyBuilder, { propsData, store, vuetify });
  expect(wrapper.vm.saveDraft).toBeInstanceOf(Function);
  const input = wrapper.findComponent(SurveyNameEditor);
  expect(input.vm.value).toBe(survey.name);
});

const addControl = async (container, type, { dataName, label, hint, moreInfo } = {}) => {
  await fireEvent.click(getByTestId(container, 'control-adder-open'));
  await fireEvent.click(getByTestId(container, `add-control-${type}`));

  const fields = [
    [dataName, 'Data name'],
    [label, 'Label'],
    [hint, 'Hint'],
    [moreInfo, 'More info'],
  ];
  for (const [value, domLabel] of fields) {
    if (isString(value)) {
      const props = getByTestId(container, 'control-properties');
      await fireEvent.update(getByLabelText(props, domLabel), value);
    }
  }
};

const optionsWithControls = (controls = []) => {
  const survey = {
    ...createSurvey({ group: { id: null, path: null } }),
    name: 'survey name',
    id: 'survey_id',
    latestVersion: 2,
  };
  survey.revisions.push({
    dateCreated: survey.revisions[0].currentDate,
    version: 2,
    controls,
  });
  const props = { survey };
  const store = createStoreObject();
  return {
    props,
    router,
    vuetify,
    store,
  };
};

describe('add control', () => {
  availableControls
    .filter(({ type }) => type !== 'script') // TODO load scripts from vuex instead of getting them from the server
    .forEach((info) => {
      it(`can add ${info.type} type control`, async () => {
        const options = optionsWithControls();
        const spyDraftInit = jest.spyOn(options.store.modules.draft.actions, 'init');
        const { getByTestId, container, getByText } = render(SurveyBuilder, options);

        const label = `Test add ${info.type}`;
        const dataName = 'some_control';
        await addControl(container, info.type, { label, dataName });

        // adds control to the graphical view
        await findByText(getByTestId('graphical-view'), label);

        // saves the control to the draft store
        await fireEvent.click(getByText('Save'));
        expect(spyDraftInit).toHaveBeenCalled();
        const control = last(last(spyDraftInit.mock.calls)[1].survey.revisions).controls[0];
        expect(control).toEqual(expect.objectContaining({ name: dataName, label, type: info.type }));
      });
    });

  ['page', 'group'].forEach((parentType) => {
    it(`inserts control into selected ${parentType}`, async () => {
      const parent = createControlInstance({ type: parentType, name: 'parent_control', children: [] });
      const options = optionsWithControls([parent]);
      const { getByTestId, container, getByText } = render(SurveyBuilder, options);
      const parentCard = getByTestId(`control-card-${parent.id}`);

      // select the parent card
      await fireEvent.mouseDown(parentCard);
      await new Promise((r) => setTimeout(r, 2000));
      // add a new control
      const label = 'Child Control';
      await addControl(container, 'number', { label });
      // new card appears inside the parent card
      expect(within(parentCard).queryByText(label)).not.toBeNull();

      // saves the controls to the draft store
      await fireEvent.click(getByText('Save'));
      const draftRevision = last(options.store.modules.draft.state.survey.revisions);
      const parentControl = draftRevision.controls[0];
      expect(parentControl).toEqual(expect.objectContaining({ id: parent.id }));
      expect(parentControl.children).toHaveLength(1);
      expect(parentControl.children[0]).toEqual(expect.objectContaining({ label, type: 'number' }));
    });
  });
});
