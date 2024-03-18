jest.mock('../../services/api.service.js');

import { findByText, fireEvent, screen, within } from '@testing-library/vue';
import SurveyBuilder from './SurveyBuilder.vue';
import { createSurvey } from '@/utils/surveys';
import { availableControls, createControlInstance } from '@/utils/surveyConfig';
import { cloneDeep, isString, last, set, uniqueId } from 'lodash';
import api from '../../services/api.service.js';
import { renderWithVuetify } from '../../../tests/renderWithVuetify';
import { createStore } from 'vuex';
import { createStoreObject } from '../../store';
import { resourceLocations, resourceTypes } from '@/utils/resources';


// add a control and set its base parameters like a user would
const addControl = async (type, { dataName, label, hint, moreInfo } = {}) => {
  await fireEvent.click(screen.getByTestId('control-adder-open'));
  await fireEvent.click(screen.getByTestId(`add-control-${type}`));

  const fields = [
    [dataName, 'Value'],
    [label, 'Label'],
    [hint, 'Hint'],
    [moreInfo, 'More info'],
  ];
  for (const [value, domLabel] of fields) {
    if (isString(value)) {
      await updateProperty(domLabel, value);
    }
  }
};

// this function handles updating checkboxes and text inputs
// notably, it cannot update a selection from a dropdown, yet.
const updateProperty = async (label, value, openAdvanced) => {
  const props = screen.getByTestId('control-properties');
  if (openAdvanced) {
    await fireEvent.click(within(props).getByText(/advanced/i));
  }
  const input = within(props).getAllByLabelText(label)[0];
  if (typeof value === 'boolean') { // input is assumed to be a checkbox
    const inputNeedsToGoFromTrueToFalse = input.checked && value === false;
    const inputNeedsToGoFromFalseToTrue = !input.checked && value === true;
    if (inputNeedsToGoFromTrueToFalse || inputNeedsToGoFromFalseToTrue) {
      await fireEvent.click(input);
    }
  } else { // input is assumed to be a text input
    await fireEvent.update(input, value); 
  }
};

// saves the survey to the draft store and returns the newly created revision
export const saveDraft = async (store, surveyDetails) => {
  await fireEvent.click(within(surveyDetails).getByText('Save'));
  return last(store.getters['draft/survey'].revisions);
};

// creates the default mounting options
export const optionsWithControls = (controls = []) => {
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
  return {
    props,
  };
};

export const makeControl = ({ type, ...options }) => ({
  ...createControlInstance({ type }),
  name: `${type}_${uniqueId()}`,
  children: ['page', 'group'].includes(type) ? [] : undefined,
  ...options,
});

export const createApiGetMock = (reqResMap) => {
  reqResMap = {
    // atm, ControlProperties.vue throws when trying to fetch /scrips for script type controls
    '/scripts': { data: [] },
    // the SurveyBuilder component always calls this url when it's mounted
    [`/surveys/check-for-updates/${optionsWithControls().props.survey._id}`]: { data: {} },
    ...reqResMap,
  };
  return jest.fn((url) => {
    if (url in reqResMap) {
      return cloneDeep(reqResMap[url]);
    }
    throw Error(`Don't have a mocked response for "${url}"`);
  });
};

// setup the default api mocks for all tests
beforeEach(() => api.get.mockImplementation(createApiGetMock()));

describe('add control', () => {
  describe('for each control type', () => {
    availableControls.forEach((info) => {
      it(`can add ${info.type} type control`, async () => {
        // render the component and spy on the draft/init vuex action
        const options = optionsWithControls();
        const store = createStore(createStoreObject());
        jest.spyOn(store, 'dispatch');
        renderWithVuetify(SurveyBuilder, options, store);
        const surveyDetails = screen.getByTestId('survey-details');

        // add the new control
        const label = `Test add ${info.type}`;
        const dataName = 'some_control';
        await addControl(info.type, { label, dataName });

        // control added to the graphical view
        await findByText(screen.getByTestId('graphical-view'), label);

        // the control is saved in the draft store
        await fireEvent.click(within(surveyDetails).getByText('Save'));
        expect(store.dispatch).toHaveBeenCalledWith(
          'draft/init',
          expect.objectContaining({
            survey: expect.objectContaining({
              revisions: expect.arrayContaining([
                expect.objectContaining({
                  controls: [expect.objectContaining({ name: dataName, label, type: info.type })],
                })
              ])
            })
          }));
      });
    });
  });

  describe('update properties', () => {
    // all the string/bool props with arbitrary control types
    [
      { inputLabel: 'Label', type: 'string', value: 'Foo Bar', propPath: 'label' },
      { inputLabel: 'Value', type: 'number', value: 'control_name', propPath: 'name' },
      { inputLabel: 'Hint', type: 'page', value: 'Heads up!', propPath: 'hint' },
      { inputLabel: 'Default value', type: 'string', value: 'Initial', propPath: 'defaultValue' },
      { inputLabel: 'QR Code', type: 'string', value: true, propPath: 'options.enableQr' },
      { inputLabel: 'Required', type: 'matrix', value: true, propPath: 'options.required' },
      { inputLabel: 'Private', type: 'matrix', value: true, propPath: 'options.redacted' },
      {
        inputLabel: 'Relevance Expression',
        type: 'number',
        value: true,
        propPath: 'options.relevance',
        propValue: { enabled: true, code: expect.any(String) },
        openAdvanced: true,
      },
      {
        inputLabel: 'Api Compose Expression',
        type: 'number',
        value: true,
        propPath: 'options.apiCompose',
        propValue: { enabled: true, code: expect.any(String) },
        openAdvanced: true,
      },
      {
        inputLabel: 'Multiple select',
        type: 'farmOsFarm',
        value: true,
        propPath: 'options.hasMultipleSelections',
      },
      {
        inputLabel: 'Run Button Label',
        type: 'script',
        value: 'Go',
        propPath: 'options.buttonLabel',
      },
      {
        inputLabel: 'Multiple select',
        type: 'ontology',
        value: true,
        propPath: 'options.hasMultipleSelections',
      },
      {
        inputLabel: 'Allow custom answer',
        type: 'ontology',
        value: true,
        propPath: 'options.allowCustomSelection',
      },
      {
        inputLabel: 'Show Polygon Control',
        type: 'geoJSON',
        value: false,
        propPath: 'options.geoJSON.showPolygon',
      },
      {
        inputLabel: 'Show Line Control',
        type: 'geoJSON',
        value: false,
        propPath: 'options.geoJSON.showLine',
      },
      {
        inputLabel: 'Show Point Control',
        type: 'geoJSON',
        value: false,
        propPath: 'options.geoJSON.showPoint',
      },
      {
        inputLabel: 'Show Circle Control',
        type: 'geoJSON',
        value: false,
        propPath: 'options.geoJSON.showCircle',
      },
      {
        inputLabel: 'Show geotrace control',
        type: 'geoJSON',
        value: true,
        propPath: 'options.geoJSON.showGeoTrace',
      },
      // TODO: Once the `updateProperty` function in this file can update dropdown selections, we can add this test case back
      // { inputLabel: 'Type', type: 'date', value: 'date-year', propPath: 'options.subtype' },
      {
        inputLabel: 'Allow hide',
        type: 'number',
        value: true,
        propPath: 'options.allowHide',
        isLibrary: true,
      },
      {
        inputLabel: 'Allow modify',
        type: 'date',
        value: true,
        propPath: 'options.allowModify',
        isLibrary: true,
      },
      // TODO test changing options.hidden
    ].forEach(({ type, inputLabel, value, propPath, propValue = null, openAdvanced = false, isLibrary = false }) => {
      if (propValue === null) {
        propValue = value;
      }
      it(`can update the "${inputLabel}" property of a ${type} control`, async () => {
        // render the component and spy on the draft/init vuex action
        const options = optionsWithControls();
        options.props.survey.meta.isLibrary = isLibrary;
        const store = createStore(createStoreObject());
        renderWithVuetify(SurveyBuilder, options, store);
        const surveyDetails = screen.getByTestId('survey-details');

        // add the new control
        await addControl(type);
        // update the property
        updateProperty(new RegExp(inputLabel, 'i'), value, openAdvanced);

        // get the saved draft controls from the vuex store
        const draftRevision = await saveDraft(store, surveyDetails);
        const expectedControl = { type };
        set(expectedControl, propPath, propValue);
        expect(draftRevision.controls).toMatchObject([expectedControl]);
      });
    });
  });

  describe('inserting new control based on current selection (NGC = non group/page type control)', () => {
    const SELECTED = 'selected_control_id';
    [
      {
        name: 'inserts NGC into the selected page',
        addType: 'number',
        controls: [makeControl({ type: 'page', id: SELECTED })],
        expectedPosition: [0, 0],
      },
      {
        name: 'inserts NGC into the selected group',
        addType: 'string',
        controls: [makeControl({ type: 'group', id: SELECTED })],
        expectedPosition: [0, 0],
      },
      {
        name: 'inserts page at the root level when a page is selected',
        addType: 'page',
        controls: [makeControl({ type: 'page', id: SELECTED })],
        expectedPosition: [1],
      },
      {
        name: 'inserts page at the root level when a group is selected',
        addType: 'page',
        controls: [makeControl({ type: 'group', id: SELECTED })],
        expectedPosition: [1],
      },
      {
        name: 'inserts page at the root level when a group/group/NGC is selected',
        addType: 'page',
        controls: [
          makeControl({
            type: 'group',
            children: [
              makeControl({
                type: 'group',
                children: [makeControl({ type: 'group', id: SELECTED })],
              }),
            ],
          }),
        ],
        expectedPosition: [1],
      },
      {
        name: 'inserts NGC right after the selected NGC',
        addType: 'date',
        controls: [
          makeControl({ type: 'number' }),
          makeControl({ type: 'string', id: SELECTED }),
          makeControl({ type: 'location' }),
        ],
        expectedPosition: [2],
      },
      {
        name: 'inserts NGC right after the selected NGC in a group',
        addType: 'script',
        controls: [
          makeControl({
            type: 'group',
            children: [
              makeControl({ type: 'selectSingle', id: SELECTED }),
              makeControl({ type: 'selectMultiple' }),
              makeControl({ type: 'instructionsImageSplit' }),
            ],
          }),
        ],
        expectedPosition: [0, 1],
      },
      {
        name: 'inserts control at the end of the root when nothing is selected',
        addType: 'ontology',
        controls: [makeControl({ type: 'selectSingle' }), makeControl({ type: 'group' })],
        expectedPosition: [2],
      },
    ].forEach(({ name, addType, controls, expectedPosition }) => {
      it(name, async () => {
        const options = optionsWithControls(controls);
        const store = createStore(createStoreObject());
        renderWithVuetify(SurveyBuilder, options, store);
        const surveyDetails = screen.getByTestId('survey-details');

        // select the parent card
        const selectedCard = screen.queryByTestId(`control-card-${SELECTED}`);
        if (selectedCard) {
          await fireEvent.mouseDown(selectedCard);
        }
        // add the new control
        const label = 'Child Control';
        await addControl(addType, { label });
        // new card appears
        expect(within(screen.getByTestId('graphical-view')).queryByText(label)).toBeInTheDocument();

        const draftRevision = await saveDraft(store, surveyDetails);

        // build the minimal expected control tree
        const expectedControls = cloneDeep(controls);
        // push the new control into the expected position
        expectedPosition.reduce((parentChildren, pos, index, list) => {
          if (index === list.length - 1) {
            parentChildren[pos] = { type: addType, label };
          } else {
            return parentChildren[pos].children;
          }
        }, expectedControls);
        expect(draftRevision.controls).toMatchObject(expectedControls);
      });
    });
  });
});

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
        [`/surveys/${qsl._id}?version=latest`]: { data: qsl },
      })
    );
  });

  it('can add a question set library', async () => {
    // render the component
    const options = optionsWithControls();
    const store = createStore(createStoreObject());
    renderWithVuetify(SurveyBuilder, options, store);
    const surveyDetails = screen.getByTestId('survey-details');

    // add a qsl to the survey like a user would
    await fireEvent.click(screen.getByTestId('control-adder-open'));
    await fireEvent.click(screen.getByTestId('add-control-library'));
    const questionLibrary = screen.getByTestId('question-library');
    const libCard = await findByText(questionLibrary, qsl.name);
    await fireEvent.click(libCard);
    const addBtn = await within(questionLibrary).findByText(/add to survey/i);
    fireEvent.click(addBtn);

    // save draft and get the value from vuex
    const savedRevision = await saveDraft(store, surveyDetails);

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
        const options = optionsWithControls();
        const component = {
          survey: options.props.survey,
          surveyUnderWork: options.props.survey,
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
      let component;
      beforeEach(() => {
        const options = optionsWithControls();
        component = {
          survey: options.props.survey,
          surveyUnderWork: options.props.survey,
          controlAdded: jest.fn(),
          updateLibraryResources,
          cleanupLibraryResources,
        };
      });

      it('adds a new group control', async () => {
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
        surveyUnderWork: currentSurvey,
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
