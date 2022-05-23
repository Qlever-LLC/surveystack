import { createApiGetMock, optionsWithControls, saveDraft, makeControl } from '@/components/builder/SurveyBuilder.spec';
import { findByText, fireEvent, render, screen, within } from '@testing-library/vue';
import SurveyBuilder from './SurveyBuilder.vue';
import { createSurvey } from '@/utils/surveys';
import { createControlInstance } from '@/utils/surveyConfig';
import { cloneDeep } from 'lodash';
import '@/components/survey/question_types';
import api from '../../services/api.service.js';

jest.mock('../../services/api.service.js');

// setup the default api mocks for all tests
beforeEach(() => api.get.mockImplementation(createApiGetMock()));

describe('question set library', () => {
  // mock QSL data
  let qsl, qslControlNumber, qslControlDropdown;
  beforeEach(() => {
    qsl = {
      ...createSurvey({}),
      name: 'test_survey_name',
      _id: 'test_survey_id',
      latestVersion: 2,
      isLibrary: true,
    };
    qslControlNumber = makeControl({ type: 'number', name: 'number_1' });
    qslControlDropdown = makeControl({
      type: 'ontology',
      id: 'dropdown-1',
      name: 'dropdown_1',
      options: { source: 'dropdown_1_resource' },
    });

    qsl.revisions.push({
      version: qsl.latestVersion,
      controls: [qslControlNumber, qslControlDropdown],
    });

    // mock api responses
    const qslListResponse = {
      data: {
        content: [qsl],
        pagination: { total: 1, parsedSkip: 0, parsedLimit: 12 },
      },
    };

    api.get.mockImplementation(
      createApiGetMock({
        '/surveys/list-page?isLibrary=true&skip=0&limit=12': qslListResponse,
        [`/surveys/${qsl._id}`]: { data: qsl },
      })
    );
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
              id: expect.not.stringMatching(qslControlNumber.id), // control id has to change
              type: qslControlNumber.type,
              name: qslControlNumber.name,
              libraryId: qsl._id,
              libraryVersion: qsl.latestVersion,
            },
            {
              id: expect.not.stringMatching(qslControlDropdown.id), // control id has to change
              type: qslControlDropdown.type,
              name: qslControlDropdown.name,
              libraryId: qsl._id,
              libraryVersion: qsl.latestVersion,
            },
          ],
        },
      ],
    });
  });

  describe('methods.addQuestionsFromLibrary', () => {
    const { addQuestionsFromLibrary, cleanupLibraryResources } = SurveyBuilder.methods;

    describe('resources', () => {
      const runTest = async (surveyResources, qslResources, expectedResources, doCleanup) => {
        const component = {
          ...optionsWithControls().props,
          controlAdded: jest.fn(),
          cleanupLibraryResources: doCleanup ? cleanupLibraryResources : jest.fn(),
        };
        component.survey.resources = surveyResources;
        qsl.resources = qslResources;

        await addQuestionsFromLibrary.call(component, qsl._id);

        expect(component.survey.resources).toMatchObject(expectedResources);
        return component.survey.resources;
      };

      it('adds resources from the QSL', async () => {
        const resourceCurrent = { id: 'keep this', foo: 1 };
        const resourceFromQsl = { id: qslControlDropdown.options.source, bar: 2 };
        const expectedResource = { origin: qslControlDropdown.options.source, bar: 2 };
        await runTest([resourceCurrent], [resourceFromQsl], [resourceCurrent, expectedResource], false);
      });
      it('removes unused resources from any QSL', async () => {
        const resourceSameLib = { libraryId: qsl._id };
        const resourceOther = { libraryId: 'unused-resource-from-another-qsl' };
        await runTest([resourceSameLib, resourceOther], [], [], true);
      });
      it('sets qsl id/version on the resource', async () => {
        const resourceQsl = { foo: 2 };
        const resourceCopy = {
          ...resourceQsl,
          libraryId: qsl._id,
          libraryVersion: qsl.latestVersion,
        };
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
      it('adds a new group control', async () => {
        const component = { ...optionsWithControls().props, controlAdded: jest.fn(), cleanupLibraryResources };

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

      describe('adds the QSL info to the copied controls', () => {
        it('works with newly added QSL', async () => {
          const component = { ...optionsWithControls().props, controlAdded: jest.fn(), cleanupLibraryResources };
          const num = createControlInstance({ type: 'number', name: 'number_1' });
          const childSrt = createControlInstance({ type: 'string', name: 'string_1' });
          const group = createControlInstance({
            type: 'group',
            name: 'group_1',
            children: [childSrt],
          });
          qsl.revisions[1].controls = cloneDeep([num, group]);

          await addQuestionsFromLibrary.call(component, qsl._id);
          const addedGroup = component.controlAdded.mock.calls[0][0];

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
          expect(addedGroup.children[0].libraryIsInherited).toBeFalsy();
          expect(addedGroup.children[1].libraryIsInherited).toBeFalsy();
          expect(addedGroup.children[1].children[0].libraryIsInherited).toBeFalsy();
        });

        it('sets the inherited flag if the QSL control comes from another QSL', async () => {
          const otherLibInfo = { libraryId: 'other_qsl', libraryVersion: 3 };
          const component = { ...optionsWithControls().props, controlAdded: jest.fn(), cleanupLibraryResources };
          const num = createControlInstance({ type: 'number', name: 'number_1' });
          const childSrt = createControlInstance({
            type: 'string',
            name: 'string_1',
            ...otherLibInfo,
          });
          const group = createControlInstance({
            type: 'group',
            name: 'group_1',
            children: [childSrt],
            ...otherLibInfo,
            isLibraryRoot: true,
          });
          qsl.revisions[1].controls = cloneDeep([num, group]);

          await addQuestionsFromLibrary.call(component, qsl._id);
          const addedGroup = component.controlAdded.mock.calls[0][0];

          expect(addedGroup.children).toMatchObject([
            {
              ...num,
              libraryId: qsl._id,
              libraryVersion: qsl.latestVersion,
              id: expect.not.stringMatching(num.id),
            },
            {
              ...group,
              libraryIsInherited: true,
              id: expect.not.stringMatching(group.id),
              children: [
                {
                  ...childSrt,
                  id: expect.not.stringMatching(childSrt.id),
                  libraryIsInherited: true,
                },
              ],
            },
          ]);
          expect(addedGroup.children[0].libraryIsInherited).toBeFalsy();
        });
      });
    });
  });

  describe('methods.updateLibraryConfirmed', () => {
    const { addQuestionsFromLibrary, updateLibraryConfirmed, updateLibraryResources, cleanupLibraryResources } =
      SurveyBuilder.methods;

    describe('updating controls', () => {
      it.todo('updates the library root group');
    });
    describe.skip('resources', () => {
      const runTest = async (updatedLibraryControls, updatedResources, expectedResources) => {
        const component = {
          ...optionsWithControls().props,
          controlAdded: jest.fn(),
          updateLibraryResources: updateLibraryResources,
          cleanupLibraryResources: cleanupLibraryResources,
          updateToLibrary: qsl, //TODO
        };
        qsl.resources = updatedResources;
        await addQuestionsFromLibrary.call(component, qsl._id);
        await updateLibraryConfirmed.call(component, updatedLibraryControls);
        expect(component.survey.resources).toMatchObject(expectedResources);
        return component.survey.resources;
      };
      it('updates resources from the QSL', async () => {
        const resourceCurrent = { id: 'keep this', foo: 1 };
        const resourceFromQsl = { id: qslControlDropdown.options.source, bar: 2 };
        const expectedResource = { origin: qslControlDropdown.options.source, bar: 2 };
        await runTest([resourceCurrent], [resourceFromQsl], [resourceCurrent, expectedResource], false);
      });
      it('removes unused resources from any QSL', async () => {
        const resourceSameLib = { libraryId: qsl._id };
        const resourceOther = { libraryId: 'unused-resource-from-another-qsl' };
        await runTest([resourceSameLib, resourceOther], [], [], true);
      });
    });
  });
});
