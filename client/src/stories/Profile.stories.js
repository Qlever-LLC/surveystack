import Vue from 'vue';
import VueCompositionApi from '@vue/composition-api';
Vue.use(VueCompositionApi);

import TableComponent from '../components/integrations/FarmOSProfile.vue';
import TableGroup from '../components/integrations/FarmOSManage.vue';

import { action } from '@storybook/addon-actions';

export default {
  title: 'FarmOS',
  component: TableComponent,
  TableGroup,
  argTypes: {},
};

const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { TableComponent },
  template: '<table-component @onCloseGrpAccess="onA" @onCloseOthAccess="onB" v-bind="$props" />',
  methods: { onA: action('group'), onB: action('other') },
});

const TemplateGroup = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { TableGroup },
  template: '<table-group v-bind="$props" :members="unifomMembers()" />',
  methods: {},
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

export const FarmOSManage = TemplateGroup.bind({});
FarmOSManage.args = {
  groupHasFarmOSAccess: true,
  groupHasCoffeeShopAccess: true,
  allowSubgroupsToJoinCoffeeShop: true,
  allowSubgroupAdminsToCreateFarmOSInstances: true,
  name: 'Bionutrient > Labs',
  seats: {
    current: 7,
    max: 20,
  },
  members: [
    {
      name: 'Dan TerAvest',
      email: 'teravestdan@gmail.com',
      admin: true,
      connectedFarms: [
        {
          url: 'dan_teravest_farm.farmos.net',
          owner: true,
          memberships: ['Bionutrient > Labs'],
        },
        {
          url: 'lees_farm.farmos.net',
          owner: true,
          memberships: ['Bionutrient > Labs', 'Bionutrient > Labs > Michigan'],
        },
        {
          url: 'ourscinet.farmos.net',
          owner: false,
          memberships: [
            'Bionutrient > Labs',
            'Bionutrient > Labs > Michigan',
            'Bionutrient > Labs > Europe',
            'Bionutrient > Labs > Community',
            'Bionutrient > Labs > Community > Lab',
          ],
        },
        {
          url: 'coffeeshop.farmos.net',
          owner: false,
        },
      ],
    },
    {
      name: 'Dave Jole',
      email: 'djole2352@gmail.com',
      admin: false,
      connectedFarms: [],
    },
    {
      name: 'Jenny Jennerson',
      email: 'bigjenny@bj.net',
      connectedFarms: [
        {
          url: 'jennybigfarmstand.farmos.net',
          owner: true,
          memberships: ['Bionutrient > Lab > Michigan'],
        },
      ],
    },
    {
      name: 'Jenny AA',
      email: 'bigAAjenny@bj.net',
      connectedFarms: [
        {
          url: 'jennybigfarmstand.farmosA.net',
          owner: true,
          memberships: ['Bionutrient > Lab > Michigan'],
        },
      ],
    },
    {
      name: 'Jenny AB',
      email: 'bigABjenny@bj.net',
      connectedFarms: [
        {
          url: 'jennybigfarmstand.farmosB.net',
          owner: true,
          memberships: [
            'Bionutrient > Labs',
            'Bionutrient > Labs > Michigan',
            'Bionutrient > Labs > Europe',
            'Bionutrient > Labs > Community',
            'Bionutrient > Labs > Community > Lab',
          ],
        },
      ],
    },
    {
      name: 'Jenny CD',
      email: 'bigCDjenny@bj.net',
      connectedFarms: [
        {
          url: 'jennybigfarmstand.farmosC.net',
          owner: true,
          memberships: ['Bionutrient > Lab > Michigan'],
        },
      ],
    },
    {
      name: 'Jenny DD',
      email: 'bigDDjenny@bj.net',
      connectedFarms: [
        {
          url: 'jennybigfarmstand.farmosD.net',
          owner: true,
          memberships: ['Bionutrient > Lab > Michigan'],
        },
      ],
    },
    {
      name: 'Jenny AE',
      email: 'bigAEjenny@bj.net',
      connectedFarms: [
        {
          url: 'jennybigfarmstand.farmosE.net',
          owner: true,
          memberships: ['Bionutrient > Lab > Michigan'],
        },
      ],
    },
    {
      name: 'Jenny AF',
      email: 'bigFAjenny@bj.net',
      connectedFarms: [
        {
          url: 'jennybigfarmstand.farmosF.net',
          owner: true,
          memberships: ['Bionutrient > Lab > Michigan'],
        },
      ],
    },
  ],
  unifomMembers() {
    this.members.forEach((el) => {
      if (el.connectedFarms[0] == undefined) {
        el.connectedFarms.push({});
      }
    });
    return this.members;
  },
};
