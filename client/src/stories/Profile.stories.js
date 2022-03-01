import Vue from 'vue';
import VueCompositionApi from '@vue/composition-api';
Vue.use(VueCompositionApi);

import TableComponent from '../components/integrations/FarmOSProfile.vue';
import { action } from '@storybook/addon-actions';

export default {
  title: 'FarmOS',
  component: TableComponent,
  argTypes: {},
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { TableComponent },
  template: '<table-component @onCloseGrpAccess="onA" @onCloseOthAccess="onB" v-bind="$props" />',
  methods: { onA: action('group'), onB: action('other') },
});

export const ProfilePage = Template.bind({});
ProfilePage.args = {
  headers: [
    { key: 'url', label: 'FarmOS Farm URL' },
    { key: 'grpAccess', label: 'Groups with access' },
    { key: 'othAccess', label: 'Other users with access' },
  ],
  items: [
    {
      url: 'dan_teravest_farm.farmos.net',
      grpAccess: [
        { id: 10, value: 'Our Sci' },
        { id: 13, value: 'Bionutrient Institute' },
        { id: 20, value: 'PASA' },
      ],
      othAccess: [
        { id: 21, value: 'gbathree@gmail.com' },
        { id: 22, value: 'joesmoe@joe.net' },
      ],
    },
    {
      url: 'ourscillc.farmos.net',
      grpAccess: [],
      othAccess: [],
    },
  ],
};
