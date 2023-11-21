jest.mock('../../services/api.service.js');

import { findByText, fireEvent, render, screen, within } from '@testing-library/vue';
import SurveyBuilder from './SurveyBuilder.vue';
import { createSurvey } from '@/utils/surveys';
import { createStoreObject } from '@/store';
import vuetify from '@/plugins/vuetify';
import { availableControls, createControlInstance } from '@/utils/surveyConfig';
import router from '@/router';
import { cloneDeep, isString, last, set, uniqueId } from 'lodash';
import '@/components/survey/question_types';
import api from '../../services/api.service.js';

import { localVue } from '@/../tests/renderWithVuetify';

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

const updateProperty = async (label, value, openAdvanced) => {
  const props = screen.getByTestId('control-properties');
  if (openAdvanced) {
    await fireEvent.click(within(props).getByText(/advanced/i));
  }
  const input = within(props).getAllByLabelText(label)[0];
  await fireEvent.update(input, value);
};

// saves the survey to the draft store and returns the newly created revision
export const saveDraft = async (store) => {
  const surveyDetails = screen.getByTestId('survey-details');
  await fireEvent.click(within(surveyDetails).getByText('Save'));
  return last(store.modules.draft.state.survey.revisions);
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
  const store = createStoreObject();
  store.getters = {
    'toggle/isOn': () => ({ feature_resource: true }),
  };
  return {
    props,
    router,
    vuetify,
    store,
    localVue,
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
        const spyDraftInit = jest.spyOn(options.store.modules.draft.actions, 'init');
        render(SurveyBuilder, options);

        // add the new control
        const label = `Test add ${info.type}`;
        const dataName = 'some_control';
        await addControl(info.type, { label, dataName });

        // control added to the graphical view
        await findByText(screen.getByTestId('graphical-view'), label);

        // the control is saved in the draft store
        const surveyDetails = screen.getByTestId('survey-details');
        await fireEvent.click(within(surveyDetails).getByText('Save'));
        expect(spyDraftInit).toHaveBeenCalled();
        const controls = last(last(spyDraftInit.mock.calls)[1].survey.revisions).controls;
        expect(controls).toMatchObject([{ name: dataName, label, type: info.type }]);
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
      /*{ TODO not implemented yet - decide to implement or remove
        inputLabel: 'Calculate Expression',
        type: 'number',
        value: true,
        propPath: 'options.calculate',
        propValue: { enabled: true, code: expect.any(String) },
        openAdvanced: true,
      },*/
      /*{ TODO not implemented yet - decide to implement or remove
        inputLabel: 'Constraint Expression',
        type: 'number',
        value: true,
        propPath: 'options.constraint',
        propValue: { enabled: true, code: expect.any(String) },
        openAdvanced: true,
      },*/
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
        inputLabel: 'Autocomplete',
        type: 'ontology',
        value: true,
        propPath: 'options.allowAutocomplete',
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
      { inputLabel: 'Type', type: 'date', value: 'date-year', propPath: 'options.subtype' },
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
        render(SurveyBuilder, options);

        // add the new control
        await addControl(type);
        // update the property
        updateProperty(new RegExp(inputLabel, 'i'), value, openAdvanced);

        // get the saved draft controls from the vuex store
        const draftRevision = await saveDraft(options.store);
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
        render(SurveyBuilder, options);

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

        const draftRevision = await saveDraft(options.store);

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
