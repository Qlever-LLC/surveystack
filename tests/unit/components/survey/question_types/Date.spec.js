import {
  mount,
  createLocalVue,
} from '@vue/test-utils';
import Vue from 'vue';
import Vuetify from 'vuetify';
import Date from '@/components/survey/question_types/Date.vue';


// const control = {
//   name: 'date_1',
//   label: 'Enter a date 1',
//   type: 'date',
//   options: {
//     readOnly: false,
//     required: false,
//     redacted: false,
//     relevance: {
//       enabled: false,
//       code: '',
//     },
//     constraint: {
//       enabled: false,
//       code: '',
//     },
//     calculate: {
//       enabled: false,
//       code: '',
//     },
//   },
//   value: null,
// };
import {
  createControlInstance,
  availableControls,
} from '@/utils/surveyConfig';

const dateControl = createControlInstance(
  availableControls.find(c => c.type === 'date'),
);

Vue.use(Vuetify);
const localVue = createLocalVue();


describe.skip('Date Question Type', () => {
  let vuetify;
  beforeEach(() => {
    vuetify = new Vuetify();
  });

  test('renders menu passed', () => {
    // const msg = 'new message';


    const wrapper = mount(Date, {
      localVue,
      vuetify,
      propsData: {
        control: dateControl,
        value: null,
        index: 0,
      },
      data() {
        return {
          // menu1: true,
        };
      },
    });
    // expect(wrapper.text()).toMatch(msg);
    // console.log(JSON.stringify(wrapper, null, 2));
    // const container = wrapper.find('.date.question');
    // console.log('container', container.exists());

    const textInput = wrapper.find('.v-text-field__slot').find('input[type="text"]');
    // // const thing = wrapper.find('input[type="text"]');
    expect(textInput.exists()).toBe(true);
    // console.log('textInput', textInput.exists());
    expect(true).toBe(true);
    // textInput.trigger('click');

    // const datePicker = wrapper.find('v-picker__body');

    // console.log('date picker', datePicker.exists(), wrapper.html());
    // console.log('wrapper vm', wrapper.vm.$data.menu1);
  });
});
