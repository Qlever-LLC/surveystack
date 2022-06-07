import Vue from 'vue';
import VueCompositionApi from '@vue/composition-api';
Vue.use(VueCompositionApi);

import TableComponent from '../components/integrations/FarmOSProfile.vue';
import TableGroup from '../components/integrations/FarmOSGroupSettings.vue';

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
  _id: '628bd0a08d7c284adc0542e9',
  groupId: '628bd0a08d7c284adc0542c2',
  groupHasFarmOSAccess: true,
  groupHasCoffeeShopAccess: false,
  allowSubgroupsToJoinCoffeeShop: false,
  allowSubgroupAdminsToCreateFarmOSInstances: false,
  seats: {
    current: 7,
    max: 20,
  },
  name: 'Bionutrient > Labs',
  members: [
    {
      group: '628bd0a08d7c284adc0542c2',
      role: 'true',
      m_id: '628bd0a08d7c284adc0542c8',
      location: 'Bionutrient > Labs',
      email: 'teravestdan@gmail.com',
      name: 'Dan TerAvest',
      connectedFarms: [
        {
          instanceName: 'dan_teravest_farm.farmos.net',
          owner: true,
          i_id: '628bd0a08d7c284adc0542ce',
          memberships: [
            {
              groupId: '628bd0a08d7c284adc0542c2',
              fgm_id: '628bd0a08d7c284adc0542cd',
              path: 'Bionutrient > Labs',
            },
          ],
        },
        {
          instanceName: 'lees_farm.farmos.net',
          owner: true,
          i_id: '628bd0a08d7c284adc0542d0',
          memberships: [
            {
              groupId: '628bd0a08d7c284adc0542c2',
              fgm_id: '628bd0a08d7c284adc0542cf',
              path: 'Bionutrient > Labs',
            },
            {
              groupId: '628bd0a08d7c284adc0542c3',
              fgm_id: '628bd0a08d7c284adc0542d1',
              path: 'Bionutrient > Labs > Michigan',
            },
          ],
        },
        {
          instanceName: 'ourscinet.farmos.net',
          owner: false,
          i_id: '628bd0a08d7c284adc0542d3',
          memberships: [
            {
              groupId: '628bd0a08d7c284adc0542c2',
              fgm_id: '628bd0a08d7c284adc0542d2',
              path: 'Bionutrient > Labs',
            },
            {
              groupId: '628bd0a08d7c284adc0542c3',
              fgm_id: '628bd0a08d7c284adc0542d4',
              path: 'Bionutrient > Labs > Michigan',
            },
            {
              groupId: '628bd0a08d7c284adc0542c4',
              fgm_id: '628bd0a08d7c284adc0542d5',
              path: 'Bionutrient > Labs > Europe',
            },
            {
              groupId: '628bd0a08d7c284adc0542c5',
              fgm_id: '628bd0a08d7c284adc0542d6',
              path: 'Bionutrient > Labs > Community',
            },
            {
              groupId: '628bd0a08d7c284adc0542c6',
              fgm_id: '628bd0a08d7c284adc0542d7',
              path: 'Bionutrient > Labs > Community > Lab',
            },
          ],
        },
        {
          instanceName: 'coffeeshop.farmos.net',
          owner: false,
          i_id: '628bd0a08d7c284adc0542d9',
          memberships: [
            {
              groupId: '628bd0a08d7c284adc0542c3',
              fgm_id: '628bd0a08d7c284adc0542d8',
              path: 'Bionutrient > Labs > Michigan',
            },
          ],
        },
      ],
      userId: '628bd0a08d7c284adc0542c7',
    },
    {
      group: '628bd0a08d7c284adc0542c2',
      role: 'false',
      m_id: '628bd0a08d7c284adc0542ca',
      location: 'Bionutrient > Labs',
      email: 'djole2352@gmail.com',
      name: 'Dave Jole',
      connectedFarms: [],
      userId: '628bd0a08d7c284adc0542c9',
    },
    {
      group: '628bd0a08d7c284adc0542c3',
      role: 'false',
      m_id: '628bd0a08d7c284adc0542cc',
      location: 'Bionutrient > Labs > Michigan',
      email: 'bigjenny@bj.net',
      name: 'Jenny Jennerson',
      connectedFarms: [
        {
          instanceName: 'jennybigfarmstand.farmos.net',
          owner: true,
          i_id: '628bd0a08d7c284adc0542db',
          memberships: [
            {
              groupId: '628bd0a08d7c284adc0542c3',
              fgm_id: '628bd0a08d7c284adc0542da',
              path: 'Bionutrient > Labs > Michigan',
            },
          ],
        },
      ],
      userId: '628bd0a08d7c284adc0542cb',
    },
  ],
  nonMembers: [
    {
      groupId: '628bd0a08d7c284adc0542c3',
      instanceName: 'external.farmos.net',
      path: 'Bionutrient > Labs > Michigan',
      fgm_id: '628bd0a08d7c284adc0542e1',
    },
    {
      groupId: '628bd0a08d7c284adc0542c3',
      instanceName: 'external2.farmos.net',
      path: 'Bionutrient > Labs > Michigan',
      fgm_id: '628bd0a08d7c284adc0542e6',
    },
  ],
  unifomMembers() {
    this.members.forEach((el) => {
      if (el.connectedFarms[0] == undefined) {
        el.connectedFarms.push({});
      }
    });
    this.nonMembers.forEach((el) => {
      // without this if-check, we have an infinite loop
      if (!el.connectedFarms) {
        el.connectedFarms = [];
        let memberships = [];
        memberships.push({ groupId: el.groupId, fgm_id: el.fgm_id, path: el.path });
        el.connectedFarms.push({ instanceName: el.instanceName, memberships: memberships });
        this.members.push(el);
      }
    });
    return this.members;
  },
};
