import Vue from 'vue';
import VueCompositionApi from '@vue/composition-api';
Vue.use(VueCompositionApi);

import FarmosRegister from '../pages/farmos-manage/FarmOSRegister.vue';
import { action } from '@storybook/addon-actions';

export default {
  title: 'FarmOS',
  component: FarmosRegister,
  argTypes: {},
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { FarmosRegister },
  template: '<farmos-register v-bind="$props" />',
  methods: { checkUrl: action('checkUrl'), create: action('create') },
});

export const FarmosRegisterPage = Template.bind({});
FarmosRegisterPage.args = {
  viewModel: {
    form: {
      instanceName: 'oursci.surveystack.dev',
      email: '',
      fullName: '',
      farmName: '',
      farmAddress: '',
      units: '',
      timeZone: '',
      agree: false,
    },
    groups: [
      {
        name: 'BFA',
        id: '123',
      },
    ],
    users: [
      {
        email: 'user1@test.com',
        name: 'User 1',
        id: 'u1',
      },
      {
        email: 'user2@test.com',
        name: 'User 2',
        id: 'u2',
      },
      {
        email: 'user3@test.com',
        name: 'User 3',
        id: 'u3',
      },
    ],
    fields: [
      {
        name: 'North Field',
        wkt: 'POLYGON ((-84.34150323269021 42.77962447110511, -84.34129044408108 42.77962315868189, -84.34125289315487 42.77938035618669, -84.34148535132407 42.77938298110345, -84.34150323269021 42.77962447110511))',
      },
      {
        name: 'South Field',
        wkt: 'POLYGON ((-84.34150323269021 42.77962447110511, -84.34129044408108 42.77962315868189, -84.34125289315487 42.77938035618669, -84.34148535132407 42.77938298110345, -84.34150323269021 42.77962447110511))',
      },
    ],
  },
};
