jest.mock('../../services/api.service.js');

import { render, fireEvent, findByText, getByLabelText, screen, within } from '@testing-library/vue';
import SurveyBuilder from './SurveyBuilder.vue';
import { createSurvey } from '@/utils/surveys';
import { createStoreObject } from '@/store';
import vuetify from '@/plugins/vuetify';
import { availableControls, createControlInstance } from '@/utils/surveyConfig';
import router from '@/router';
import { isString, last, cloneDeep } from 'lodash';
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

describe.only('add control', () => {
  describe('for each control type', () => {
    availableControls
      .filter(({ type }) => type !== 'script') // TODO load scripts from vuex instead of getting them from the server
      .forEach((info) => {
        it(`can add ${info.type} type control`, async () => {
          console.log(info.type);
          const options = optionsWithControls();
          const spyDraftInit = jest.spyOn(options.store.modules.draft.actions, 'init');
          const { getByTestId, container, getByText } = render(SurveyBuilder, options);

          const label = `Test add ${info.type}`;
          const dataName = 'some_control';
          await addControl(info.type, { label, dataName });

          // adds control to the graphical view
          await findByText(getByTestId('graphical-view'), label);

          // saves the control to the draft store
          await fireEvent.click(getByText('Save'));
          expect(spyDraftInit).toHaveBeenCalled();
          const control = last(last(spyDraftInit.mock.calls)[1].survey.revisions).controls[0];
          expect(control).toEqual(expect.objectContaining({ name: dataName, label, type: info.type }));
        });
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
      await addControl('number', { label });
      // new card appears inside the parent card
      expect(within(parentCard).queryByText(label)).not.toBeNull();

      // saves the controls to the draft store
      const draftRevision = await saveDraft(options.store);
      const parentControl = draftRevision.controls[0];
      expect(parentControl).toEqual(expect.objectContaining({ id: parent.id }));
      expect(parentControl.children).toHaveLength(1);
      expect(parentControl.children[0]).toEqual(expect.objectContaining({ label, type: 'number' }));
    });
  });
});

describe('question set library', () => {
  // mock QSL data
  let qsl, controlInQsl;
  beforeEach(() => {
    qsl = {
      ...createSurvey({}),
      name: 'test_survey_name',
      _id: 'test_survey_id',
      latestVersion: 2,
      isLibrary: true,
    };
    controlInQsl = createControlInstance({ type: 'number', name: 'number_1' });
    qsl.revisions.push({
      version: qsl.latestVersion,
      controls: [controlInQsl],
    });

    // mock api responses
    const qslListResponse = {
      data: {
        content: [qsl],
        pagination: { total: 1, parsedSkip: 0, parsedLimit: 12 },
      },
    };
    api.get.setResponse('/surveys/list-page?isLibrary=true&skip=0&limit=12', qslListResponse);
    api.get.setResponse(`/surveys/${qsl._id}`, { data: qsl });
  });

  it('can add a question set library', async () => {
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

    expect(savedRevision).toMatchObject({
      version: options.props.survey.latestVersion + 1,
      controls: [
        {
          name: qsl.name,
          type: 'group',
          isLibraryRoot: true,
          libraryId: qsl._id,
          libraryVersion: qsl.latestVersion,
          children: [
            {
              id: expect.not.stringMatching(controlInQsl.id), // control id has to change
              type: controlInQsl.type,
              name: controlInQsl.name,
              libraryId: qsl._id,
              libraryVersion: qsl.latestVersion,
            },
          ],
        },
      ],
    });
  });

  describe('methods.addQuestionsFromLibrary', () => {
    const { addQuestionsFromLibrary } = SurveyBuilder.methods;

    describe('resources', () => {
      const runTest = async (surveyResources, qslResources, mergedResources) => {
        const component = { ...optionsWithControls().props, controlAdded: jest.fn() };
        component.survey.resources = surveyResources;
        qsl.resources = qslResources;

        await addQuestionsFromLibrary.call(component, qsl._id);

        expect(component.survey.resources).toMatchObject(mergedResources);
        return component.survey.resources;
      };

      it('adds resources from the QSL', async () => {
        const resourceCurrent = { foo: 1 };
        const resourceFromQsl = { bar: 2 };
        await runTest([resourceCurrent], [resourceFromQsl], [resourceCurrent, resourceFromQsl]);
      });
      it('removes old resources of the same QSL', async () => {
        const resourceSameLib = { libraryId: qsl._id };
        const resourceOther = { libraryId: 'not_related_to_this_qsl' };
        await runTest([resourceSameLib, resourceOther], [], [resourceOther]);
      });
      it('updates resources of the same QSL', async () => {
        const resourceOld = { libraryId: qsl._id, foo: 1 };
        const resourceNew = { foo: 2 };
        await runTest([resourceOld], [resourceNew], [resourceNew]);
      });
      it('sets qsl id/version on the resource', async () => {
        const resourceQsl = { foo: 2 };
        const resourceCopy = { ...resourceQsl, libraryId: qsl._id, libraryVersion: qsl.latestVersion };
        const mergedResources = await runTest([], [resourceQsl], [resourceCopy]);
        expect(mergedResources.libraryIsInherited).toBeFalsy();
      });
      it('sets flag for resources inherited from other', async () => {
        const resourceQsl = { foo: 2, libraryId: 'other_qsl_id', libraryVersion: 5 };
        const resourceCopy = { ...resourceQsl, libraryIsInherited: true };
        await runTest([], [resourceQsl], [resourceCopy]);
      });
    });

    describe('copying controls', () => {
      it("adds a new group control if the QLS if it's newly imported", async () => {
        const component = { ...optionsWithControls().props, controlAdded: jest.fn() };

        await addQuestionsFromLibrary.call(component, qsl._id);
        expect(component.controlAdded).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'group',
            name: qsl.name,
            label: qsl.name,
            isLibraryRoot: true,
            libraryId: qsl._id,
            libraryVersion: qsl.latestVersion,
          })
        );
      });

      it('updates the root control when it is provided', async () => {
        const component = { ...optionsWithControls().props, controlAdded: jest.fn() };
        const rootControl = { libraryVersion: 0 };
        await addQuestionsFromLibrary.call(component, qsl._id, rootControl);
        expect(rootControl.libraryVersion).toBe(qsl.latestVersion);
        expect(component.controlAdded).not.toHaveBeenCalled();
      });

      // run the same test twice: as adding a new QSL and as a QSL update
      const newOrUpdate = (name, runTest) => {
        describe(name, () => {
          it('works with newly added QSL', async () => {
            await runTest(async (component, id) => {
              await addQuestionsFromLibrary.call(component, id);
              return component.controlAdded.mock.calls[0][0];
            });
          });
          it('updates already added QSL', async () => {
            await runTest(async (component, id, rootControl = {}) => {
              await addQuestionsFromLibrary.call(component, id, rootControl);
              return rootControl;
            });
          });
        });
      };

      newOrUpdate('adds the QSL info to the copied controls', async (runMethod) => {
        const component = { ...optionsWithControls().props, controlAdded: jest.fn() };
        const num = createControlInstance({ type: 'number', name: 'number_1' });
        const childSrt = createControlInstance({ type: 'string', name: 'string_1' });
        const group = createControlInstance({ type: 'group', name: 'group_1', children: [childSrt] });
        qsl.revisions[1].controls = cloneDeep([num, group]);

        const addedGroup = await runMethod(component, qsl._id);

        const libInfo = { libraryId: qsl._id, libraryVersion: qsl.latestVersion };
        expect(addedGroup.children).toMatchObject([
          { ...num, ...libInfo, id: expect.not.stringMatching(num.id) },
          {
            ...group,
            ...libInfo,
            id: expect.not.stringMatching(group.id),
            children: [{ ...childSrt, ...libInfo, id: expect.not.stringMatching(childSrt.id) }],
          },
        ]);
      });

      newOrUpdate('sets the inherited flag if the QSL control comes from another QSL', async (runMethod) => {
        const otherLibInfo = { libraryId: 'other_qsl', libraryVersion: 3 };
        const component = { ...optionsWithControls().props, controlAdded: jest.fn() };
        const num = createControlInstance({ type: 'number', name: 'number_1' });
        const childSrt = createControlInstance({ type: 'string', name: 'string_1', ...otherLibInfo });
        const group = createControlInstance({
          type: 'group',
          name: 'group_1',
          children: [childSrt],
          ...otherLibInfo,
          isLibraryRoot: true,
        });
        qsl.revisions[1].controls = cloneDeep([num, group]);

        const addedGroup = await runMethod(component, qsl._id);

        expect(addedGroup.children).toMatchObject([
          { ...num, libraryId: qsl._id, libraryVersion: qsl.latestVersion, id: expect.not.stringMatching(num.id) },
          {
            ...group,
            libraryIsInherited: true,
            id: expect.not.stringMatching(group.id),
            children: [{ ...childSrt, id: expect.not.stringMatching(childSrt.id), libraryIsInherited: true }],
          },
        ]);
      });
    });
  });
});
