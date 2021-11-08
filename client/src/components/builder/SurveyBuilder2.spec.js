jest.mock('../../services/api.service.js');

import { render, fireEvent, findByText, getByLabelText, screen, within } from '@testing-library/vue';
import SurveyBuilder from './SurveyBuilder.vue';
import { createSurvey } from '@/utils/surveys';
import { createStoreObject } from '@/store';
import vuetify from '@/plugins/vuetify';
import { availableControls, createControlInstance } from '@/utils/surveyConfig';
import router from '@/router';
import { isString, last } from 'lodash';
import '@/components/survey/question_types';
import api from '../../services/api.service.js';

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

const addControl = async (type, { dataName, label, hint, moreInfo } = {}) => {
  await fireEvent.click(screen.getByTestId('control-adder-open'));
  await fireEvent.click(screen.getByTestId(`add-control-${type}`));

  const fields = [
    [dataName, 'Data name'],
    [label, 'Label'],
    [hint, 'Hint'],
    [moreInfo, 'More info'],
  ];
  for (const [value, domLabel] of fields) {
    if (isString(value)) {
      const props = screen.getByTestId('control-properties');
      await fireEvent.update(getByLabelText(props, domLabel), value);
    }
  }
};

// saves the survey to the draft store and returns the newly created revision
const saveDraft = async (store) => {
  await fireEvent.click(screen.getByText('Save'));
  return last(store.modules.draft.state.survey.revisions);
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
      const draftRevision = saveDraft(options.store);
      const parentControl = draftRevision.controls[0];
      expect(parentControl).toEqual(expect.objectContaining({ id: parent.id }));
      expect(parentControl.children).toHaveLength(1);
      expect(parentControl.children[0]).toEqual(expect.objectContaining({ label, type: 'number' }));
    });
  });
});

describe('add QSL', () => {
  it.only('can add a library', async () => {
    // mocked library data
    const qsl = {
      ...createSurvey({}),
      name: 'test_survey_name',
      _id: 'test_survey_id',
      latestVersion: 2,
      isLibrary: true,
    };
    const controlInQsl = createControlInstance({ type: 'number', name: 'number_1' });
    qsl.revisions.push({
      version: qsl.latestVersion,
      controls: [controlInQsl],
    });
    const qslListResponse = {
      data: {
        content: [qsl],
        pagination: { total: 1, parsedSkip: 0, parsedLimit: 12 },
      },
    };
    // mock api responses
    api.get.setResponse('/surveys/list-page?isLibrary=true&skip=0&limit=12', qslListResponse);
    api.get.setResponse(`/surveys/${qsl._id}`, { data: qsl });

    // render the component
    const options = optionsWithControls();
    render(SurveyBuilder, options);

    // add a qsl to the survey like a user would
    await fireEvent.click(screen.getByTestId('control-adder-open'));
    await fireEvent.click(screen.getByTestId('add-control-library'));
    const questionLibrary = screen.getByTestId('question-library');
    const libCard = await findByText(questionLibrary, qsl.name);
    await fireEvent.click(libCard);
    const addBtn = await within(questionLibrary).findByText(/add to survey/i);
    fireEvent.click(addBtn);

    // save draft and get the value from vuex
    const savedRevision = await saveDraft(options.store);

    expect(savedRevision).toEqual(
      expect.objectContaining({
        version: options.props.survey.latestVersion + 1,
        controls: expect.arrayContaining([
          expect.objectContaining({
            name: qsl.name,
            type: 'group',
            isLibraryRoot: true,
            libraryId: qsl._id,
            libraryVersion: qsl.latestVersion,
            children: expect.arrayContaining([
              expect.objectContaining({
                id: expect.not.stringMatching(controlInQsl.id), // control id has to change
                type: controlInQsl.type,
                name: controlInQsl.name,
                libraryId: qsl._id,
                libraryIsInherited: true,
                libraryVersion: qsl.latestVersion,
              }),
            ]),
          }),
        ]),
      })
    );
  });
});
