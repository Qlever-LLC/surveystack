import { mount, shallowMount, createLocalVue } from '@vue/test-utils';
import SurveyBuilder from './SurveyBuilder.vue';
import Vue from 'vue';

import Vuetify from 'vuetify';
import { getPosition } from '@/utils/surveys';
import Vuex from 'vuex';
import { renderWithVuetify } from '../../../tests/renderWithVuetify';
import { createStore, createStoreObject } from '@/store';
import VueRouter from 'vue-router';
import router from '@/router';
import AppControlInstructions from '@/components/survey/question_types/Instructions.vue';
import appControlLabel from '@/components/survey/drafts/ControlLabel.vue';
import appControlHint from '@/components/survey/drafts/ControlHint.vue';
import appControlMoreInfo from '@/components/survey/drafts/ControlMoreInfo.vue';
/*
import AppControlInstructions from '@/components/survey/question_types/Date.vue';
import AppControlInstructions from '@/components/survey/question_types/FarmOsFarm.vue';
import AppControlInstructions from '@/components/survey/question_types/FarmOsField.vue';
import AppControlInstructions from '@/components/survey/question_types/FarmOsPlanting.vue';
import AppControlInstructions from '@/components/survey/question_types/GeoJSON.vue';
import AppControlInstructions from '@/components/survey/question_types/Group.vue';
import AppControlInstructions from '@/components/survey/question_types/Instructions.vue';
import AppControlInstructions from '@/components/survey/question_types/InstructionsImageSplit.vue';
import AppControlInstructions from '@/components/survey/question_types/Location.vue';
import AppControlInstructions from '@/components/survey/question_types/Matrix.legacy.vue';
import AppControlInstructions from '@/components/survey/question_types/Matrix.vue';
import AppControlInstructions from '@/components/survey/question_types/MatrixCell.vue';
import AppControlInstructions from '@/components/survey/question_types/Number.vue';
import AppControlInstructions from '@/components/survey/question_types/Ontology.vue';
import AppControlInstructions from '@/components/survey/question_types/Page.vue';
import AppControlInstructions from '@/components/survey/question_types/Script.vue';
import AppControlInstructions from '@/components/survey/question_types/SelectMultiple.vue';
import AppControlInstructions from '@/components/survey/question_types/SelectSingle.vue';
import AppControlInstructions from '@/components/survey/question_types/String.vue';
*/
Vue.use(Vuetify);
Vue.use(Vuex);

const localVue = createLocalVue();
localVue.use(Vuex);
localVue.use(VueRouter);
localVue.component('AppControlInstructions', AppControlInstructions);
localVue.component('appControlLabel', appControlLabel);
localVue.component('appControlHint', appControlHint);
localVue.component('appControlMoreInfo', appControlMoreInfo);

function getMountOpts(opts = {}) {
  const survey = {
    _id: '612df2612678480001ab83ea',
    name: 'jesttest',
    latestVersion: 2,
    meta: {
      dateCreated: '2021-08-31T11:12:01.983+02:00',
      dateModified: '2021-08-31T11:12:09.564+02:00',
      submissions: 'public',
      creator: '5e941e98ed334505396d6481',
      group: {
        id: null,
        path: null,
      },
      specVersion: 4,
    },
    resources: [],
    revisions: [
      {
        dateCreated: '2021-08-31T11:12:01.983+02:00',
        version: 1,
        controls: [],
      },
      {
        dateCreated: '2021-08-31T11:12:09.564+02:00',
        version: 2,
        controls: [
          {
            name: 'group_1',
            label: 'My group 1',
            type: 'group',
            children: [
              {
                name: 'instructions_2',
                label: 'Instructions 2',
                type: 'instructions',
                options: {
                  readOnly: false,
                  required: false,
                  redacted: false,
                  relevance: {
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
                  source: '',
                },
                id: '612df27e2678480001ab83f0',
                hint: '',
                value: null,
              },
              {
                name: 'group_3',
                label: 'My group 3',
                type: 'group',
                children: [
                  {
                    name: 'instructions_4',
                    label: 'Instructions 4',
                    type: 'instructions',
                    options: {
                      readOnly: false,
                      required: false,
                      redacted: false,
                      relevance: {
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
                      source: '',
                    },
                    id: '612df28b2678480001ab83f4',
                    hint: '',
                    value: null,
                  },
                  {
                    name: 'group_5',
                    label: 'My group 5',
                    type: 'group',
                    children: [
                      {
                        name: 'instructions_6',
                        label: 'Instructions 6',
                        type: 'instructions',
                        options: {
                          readOnly: false,
                          required: false,
                          redacted: false,
                          relevance: {
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
                          source: '',
                        },
                        id: '612df2992678480001ab83f8',
                        hint: '',
                        value: null,
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
                    id: '612df2952678480001ab83f6',
                    hint: '',
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
                id: '612df2862678480001ab83f2',
                hint: '',
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
            id: '612df2762678480001ab83ee',
            hint: '',
          },
          {
            name: 'instructions_1',
            label: 'Instructions 1',
            type: 'instructions',
            options: {
              readOnly: false,
              required: false,
              redacted: false,
              relevance: {
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
              source: '',
            },
            id: '612df2a32678480001ab83fa',
            hint: '',
            value: null,
          },
        ],
      },
    ],
  };
  //const router = new VueRouter(); //V2
  return {
    propsData: {
      survey: survey,
      editMode: true,
    },
    localVue,
    /*mocks: {
      $router: {
        push: jest.fn(),
      },
    },*/
    store: createStoreObject(),
    router, //V1
    /*global: {
      //V2
      plugins: [router],
    },*/
  };
}

describe.skip('Survey builder', () => {
  let vuetify;
  beforeEach(() => {
    vuetify = new Vuetify();
  });

  test('adds questions from library', () => {
    //TODO
    expect(true).toBe(true);
  });

  test('updates questions from library', () => {
    //TODO
    expect(true).toBe(true);
  });
});

describe.skip('a new control is inserted', () => {
  describe('right after the selected control if new control', () => {
    test('is not a page and not a group', () => {
      const wrapper = renderWithVuetify(SurveyBuilder, getMountOpts()); //V1
      //await router.isReady(); //V2
      //const wrapper = mount(SurveyBuilder, getMountOpts()); //V2
      wrapper.setData({
        controlSelected: {
          name: 'instructions_4',
          label: 'Instructions 4',
          type: 'instructions',
          options: {
            readOnly: false,
            required: false,
            redacted: false,
            relevance: {
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
            source: '',
          },
          id: '612df28b2678480001ab83f4',
          hint: '',
          value: null,
        },
      });

      let control = {
        name: 'text_1_name',
        label: 'text_1_label',
        type: 'string',
        _id: '5e8508ecba06570001c46b15',
        hint: 'text_1_hint',
        value: null,
      };
      SurveyBuilder.methods.controlAdded(control);

      let positionOfInserted = getPosition(control, SurveyBuilder.computed.currentControls);
      expect(positionOfInserted).toStrictEqual([0, 1, 1]);
    });

    test.skip('is a group', () => {
      /*SurveyBuilder.props.survey = survey;
      SurveyBuilder.control = {
        name: 'instructions_4',
        label: 'Instructions 4',
        type: 'instructions',
        _id: '5e8508ecba06570001c46b14',
        value: null,
      };

      let control = {
        name: 'group_4_name',
        label: 'group_4_label',
        type: 'group',
        _id: '5e8508ecba06570001c46b16',
        hint: 'group_4_hint',
        value: null,
      };
      SurveyBuilder.methods.controlAdded(control);

      let positionOfInserted = getPosition(control, SurveyBuilder.computed.currentControls);
      expect(positionOfInserted).toStrictEqual([0, 1, 1]);                    */
    });
    test.skip('is a page', () => {
      /*let control = {
        name: 'page_name',
        label: 'page_label',
        type: 'page',
        _id: '5e8508ecba06570001c46b17',
        hint: 'page_hint',
        value: null,
      };
      SurveyBuilder.methods.controlAdded(control);

      let positionOfInserted = getPosition(control, SurveyBuilder.computed.currentControls);
      expect(positionOfInserted).toStrictEqual([2]);                            */
    });
  });
  /*
  describe.skip('at the end if', () => {
    test('new control is a page', () => {
      SurveyBuilder.props.survey = survey;
      SurveyBuilder.control = {
        name: 'instructions_4',
        label: 'Instructions 4',
        type: 'instructions',
        _id: '5e8508ecba06570001c46b14',
        value: null,
      };
      let control = {
        name: 'page_name',
        label: 'page_label',
        type: 'page',
        _id: '5e8508ecba06570001c46b17',
        hint: 'page_hint',
        value: null,
      };
      SurveyBuilder.methods.controlAdded(control);

      let positionOfInserted = getPosition(control, SurveyBuilder.computed.currentControls);
      expect(positionOfInserted).toStrictEqual([2]);
    });
    test('no control is selected', () => {
      SurveyBuilder.props.survey = survey;
      SurveyBuilder.control = null;
      let control = {
        name: 'text_1_name',
        label: 'text_1_label',
        type: 'string',
        _id: '5e8508ecba06570001c46b15',
        hint: 'text_1_hint',
        value: null,
      };
      SurveyBuilder.methods.controlAdded(control);

      let positionOfInserted = getPosition(control, SurveyBuilder.computed.currentControls);
      expect(positionOfInserted).toStrictEqual([0, 1, 1]);
    });
  });                               */
});
