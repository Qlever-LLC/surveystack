import { createApiGetMock, makeControl, optionsWithControls, saveDraft } from '@/components/builder/SurveyBuilder.spec';
import { findByText, fireEvent, render, screen, within } from '@testing-library/vue';
import SurveyBuilder from './SurveyBuilder.vue';
import { createSurvey } from '@/utils/surveys';
import { createControlInstance } from '@/utils/surveyConfig';
import { cloneDeep } from 'lodash';
import '@/components/survey/question_types';
import api from '../../services/api.service.js';
import { resourceLocations, resourceTypes } from '@/utils/resources';
import { createStoreObject } from '@/store';

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
    qsl.resources.push({
      id: 'dropdown_1_resource',
      label: 'dropdown_1_resource',
      name: 'dropdown_1_resource',
      type: resourceTypes.ONTOLOGY_LIST,
      location: resourceLocations.EMBEDDED,
      content: [
        {
          id: 'aaa',
          label: 'aaa',
          value: 'aaa',
          tags: 'aaa',
        },
        {
          id: 'bbb',
          label: 'bbb',
          value: 'bbb',
          tags: 'bbb',
        },
        {
          id: 'ccc',
          label: 'ccc',
          value: 'ccc',
          tags: 'ccc',
        },
      ],
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
    const { addQuestionsFromLibrary, updateLibraryResources, cleanupLibraryResources } = SurveyBuilder.methods;

    describe('resources', () => {
      const runTest = async (surveyResources, qslResources, expectedResources, doCleanup) => {
        const component = {
          ...optionsWithControls().props,
          controlAdded: jest.fn(),
          updateLibraryResources: updateLibraryResources,
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
        const component = {
          ...optionsWithControls().props,
          controlAdded: jest.fn(),
          updateLibraryResources,
          cleanupLibraryResources,
        };

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
          const component = {
            ...optionsWithControls().props,
            controlAdded: jest.fn(),
            updateLibraryResources,
            cleanupLibraryResources,
          };
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
          const component = {
            ...optionsWithControls().props,
            controlAdded: jest.fn(),
            updateLibraryResources,
            cleanupLibraryResources,
          };
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
    const { updateLibraryConfirmed, updateLibraryResources, cleanupLibraryResources } = SurveyBuilder.methods;

    const prepareBuilderComponent = async (newQSLSurvey) => {
      // define a survey builder component with a survey set consuming a qsl
      const currentSurvey = createConsumerSurvey();
      const component = {
        survey: currentSurvey,
        store: createStoreObject(),
        controlAdded: jest.fn(),
        updateLibraryResources: updateLibraryResources,
        cleanupLibraryResources: cleanupLibraryResources,
        updateToLibrary: newQSLSurvey,
        updateLibraryRootGroup: currentSurvey.revisions[0].controls[1].children[0],
      };
      return component;
    };

    it('updates the library root groups library version', async () => {
      const newQslVersion = createQSL();
      newQslVersion.latestVersion = 2;
      newQslVersion.revisions[0].version = 2;
      const component = await prepareBuilderComponent(newQslVersion);
      const updatedLibraryControls = newQslVersion.revisions[0].controls;
      await updateLibraryConfirmed.call(component, updatedLibraryControls);
      expect(component.survey.revisions[0].controls[1].children[0].libraryVersion).toBe(newQslVersion.latestVersion);
    });
    it('updates the library root group controls', async () => {
      const newQslVersion = createQSL();
      newQslVersion.latestVersion = 2;
      newQslVersion.revisions[0].version = 2;
      newQslVersion.revisions[0].controls[0].label = 'changed text label';
      newQslVersion.revisions[0].controls[1].label = 'changed dropdown label';
      const component = await prepareBuilderComponent(newQslVersion);
      const updatedLibraryControls = newQslVersion.revisions[0].controls;
      await updateLibraryConfirmed.call(component, updatedLibraryControls);
      expect(component.survey.revisions[0].controls[1].children[0].children).toMatchObject(updatedLibraryControls);
    });
    it('updates the survey resources with the latest library resources', async () => {
      const newQslVersion = createQSL();
      newQslVersion.latestVersion = 2;
      newQslVersion.revisions[0].version = 2;
      newQslVersion.resources[0].content[0].label = 'changed ontology entry label';
      const component = await prepareBuilderComponent(newQslVersion);
      const updatedLibraryControls = newQslVersion.revisions[0].controls;
      await updateLibraryConfirmed.call(component, updatedLibraryControls);
      expect(component.survey.resources[0].content[0].label).toMatch(newQslVersion.resources[0].content[0].label);
    });
    it('removes unused resources from any QSL', async () => {
      const newQslVersion = createQSL();
      const component = await prepareBuilderComponent(newQslVersion);
      const unusedResource = createQSL().resources[0];
      unusedResource.id = 'unreferenced resource id';
      unusedResource.libraryId = 'foo';
      component.survey.resources.push(unusedResource);
      const updatedLibraryControls = newQslVersion.revisions[0].controls;
      await updateLibraryConfirmed.call(component, updatedLibraryControls);
      expect(component.survey.resources).not.toContain(unusedResource);
    });
  });
});

function createConsumerSurvey() {
  return {
    _id: '6294bc5e98e9c80001bef5d0',
    name: 'consumer test',
    latestVersion: 1,
    meta: {
      dateCreated: '2022-05-30T14:45:18.448+02:00',
      dateModified: '2022-05-30T14:45:25.857+02:00',
      submissions: 'public',
      creator: '5e95ebc177ee002ae495651e',
      group: {
        id: '5e97401756f2b6000176e709',
        path: '/real-food-campaign/',
      },
      specVersion: 4,
    },
    resources: [
      {
        label: 'Dropdown Items 1',
        name: 'dropdown_items_1',
        id: '6294bc7e98e9c80001bef5d8',
        type: 'ONTOLOGY_LIST',
        location: 'EMBEDDED',
        content: [
          {
            id: '6294bb1298e9c80001bef5bd',
            label: 'a',
            value: 'a',
            tags: 'a',
          },
          {
            id: '6294bb1a98e9c80001bef5c0',
            label: 'b',
            value: 'b',
            tags: 'b',
          },
          {
            id: '6294bb1c98e9c80001bef5c3',
            label: 'c',
            value: 'c',
            tags: 'c',
          },
        ],
        origin: '6294bb1098e9c80001bef5ba',
        libraryId: '6294baff98e9c80001bef5b2',
        libraryVersion: 1,
      },
    ],
    revisions: [
      {
        dateCreated: '2022-05-30T14:45:25.857+02:00',
        version: 1,
        controls: [
          {
            name: 'text_1',
            label: 'Enter some text 1',
            type: 'string',
            options: {
              readOnly: false,
              required: false,
              redacted: false,
              relevance: {
                enabled: false,
                code: '',
              },
              initialize: {
                enabled: false,
                code: '',
              },
              constraint: {
                enabled: false,
                code: '',
              },
              calculate: {
                enabled: false,
                code: '',
              },
              apiCompose: {
                enabled: false,
                code: '',
              },
            },
            id: '6294bc6998e9c80001bef5d4',
            hint: '',
            value: null,
          },
          {
            name: 'group_2',
            label: 'My group 2',
            type: 'group',
            children: [
              {
                name: 'qs_test',
                label: 'qs test',
                type: 'group',
                children: [
                  {
                    name: 'text_1',
                    label: 'Enter some text 1',
                    type: 'string',
                    options: {
                      readOnly: false,
                      required: false,
                      redacted: false,
                      relevance: {
                        enabled: false,
                        code: '',
                      },
                      initialize: {
                        enabled: false,
                        code: '',
                      },
                      calculate: {
                        enabled: false,
                        code: '',
                      },
                      constraint: {
                        enabled: false,
                        code: '',
                      },
                      apiCompose: {
                        enabled: false,
                        code: '',
                      },
                    },
                    id: '6294bc7e98e9c80001bef5da',
                    hint: '',
                    value: null,
                    libraryId: '6294baff98e9c80001bef5b2',
                    libraryVersion: 1,
                  },
                  {
                    name: 'dropdown_2',
                    label: 'Dropdown 2',
                    type: 'ontology',
                    options: {
                      readOnly: false,
                      required: false,
                      redacted: false,
                      relevance: {
                        enabled: false,
                        code: '',
                      },
                      initialize: {
                        enabled: false,
                        code: '',
                      },
                      constraint: {
                        enabled: false,
                        code: '',
                      },
                      calculate: {
                        enabled: false,
                        code: '',
                      },
                      apiCompose: {
                        enabled: false,
                        code: '',
                      },
                      source: '6294bc7e98e9c80001bef5d8',
                    },
                    id: '6294bc7e98e9c80001bef5db',
                    hint: '',
                    value: null,
                    libraryId: '6294baff98e9c80001bef5b2',
                    libraryVersion: 1,
                  },
                ],
                options: {
                  readOnly: false,
                  required: false,
                  redacted: false,
                  relevance: {
                    enabled: false,
                    code: '',
                  },
                  initialize: {
                    enabled: false,
                    code: '',
                  },
                  constraint: {
                    enabled: false,
                    code: '',
                  },
                  calculate: {
                    enabled: false,
                    code: '',
                  },
                  apiCompose: {
                    enabled: false,
                    code: '',
                  },
                },
                id: '6294bc7e98e9c80001bef5d9',
                isLibraryRoot: true,
                libraryId: '6294baff98e9c80001bef5b2',
                libraryVersion: 1,
              },
            ],
            options: {
              readOnly: false,
              required: false,
              redacted: false,
              relevance: {
                enabled: false,
                code: '',
              },
              initialize: {
                enabled: false,
                code: '',
              },
              constraint: {
                enabled: false,
                code: '',
              },
              calculate: {
                enabled: false,
                code: '',
              },
              apiCompose: {
                enabled: false,
                code: '',
              },
            },
            id: '6294bc7198e9c80001bef5d6',
            hint: '',
          },
        ],
      },
    ],
  };
}

function createQSL() {
  return {
    _id: '6294baff98e9c80001bef5b2',
    name: 'qs test',
    latestVersion: 1,
    meta: {
      dateCreated: '2022-05-30T14:39:27.942+02:00',
      dateModified: '2022-05-30T14:44:20.146+02:00',
      submissions: 'public',
      creator: '5e95ebc177ee002ae495651e',
      group: {
        id: '5e97401756f2b6000176e709',
        path: '/test-group/',
      },
      specVersion: 4,
      libraryDescription: '<p>TEST LIBRARY</p>',
      libraryApplications: '',
      libraryMaintainers: '',
      libraryHistory: '',
      libraryLastChangeType: '',
      isLibrary: true,
    },
    resources: [
      {
        label: 'Dropdown Items 1',
        name: 'dropdown_items_1',
        id: '6294bb1098e9c80001bef5ba',
        type: 'ONTOLOGY_LIST',
        location: 'EMBEDDED',
        content: [
          {
            id: '6294bb1298e9c80001bef5bd',
            label: 'a',
            value: 'a',
            tags: 'a',
          },
          {
            id: '6294bb1a98e9c80001bef5c0',
            label: 'b',
            value: 'b',
            tags: 'b',
          },
          {
            id: '6294bb1c98e9c80001bef5c3',
            label: 'c',
            value: 'c',
            tags: 'c',
          },
        ],
      },
    ],
    revisions: [
      {
        dateCreated: '2022-05-30T14:44:20.146+02:00',
        version: 1,
        controls: [
          {
            name: 'text_1',
            label: 'Enter some text 1',
            type: 'string',
            options: {
              readOnly: false,
              required: false,
              redacted: false,
              relevance: {
                enabled: false,
                code: '',
              },
              initialize: {
                enabled: false,
                code: '',
              },
              constraint: {
                enabled: false,
                code: '',
              },
              calculate: {
                enabled: false,
                code: '',
              },
              apiCompose: {
                enabled: false,
                code: '',
              },
            },
            id: '6294bb0698e9c80001bef5b6',
            hint: '',
            value: null,
          },
          {
            name: 'dropdown_2',
            label: 'Dropdown 2',
            type: 'ontology',
            options: {
              readOnly: false,
              required: false,
              redacted: false,
              relevance: {
                enabled: false,
                code: '',
              },
              initialize: {
                enabled: false,
                code: '',
              },
              constraint: {
                enabled: false,
                code: '',
              },
              calculate: {
                enabled: false,
                code: '',
              },
              apiCompose: {
                enabled: false,
                code: '',
              },
              source: '6294bb1098e9c80001bef5ba',
            },
            id: '6294bb0d98e9c80001bef5b8',
            hint: '',
            value: null,
          },
        ],
      },
    ],
  };
}
