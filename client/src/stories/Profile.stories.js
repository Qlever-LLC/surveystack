import Vue from 'vue';

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
  template: '<table-group v-bind="$props" :groupInfos="unifomMembers()" />',
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
  returnedData: {
    _id: '628bd0a08d7c284adc0542e9',
    groupId: '628bd0a08d7c284adc0542c2',
    groupHasFarmOSAccess: true,
    groupHasCoffeeShopAccess: true,
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
        admin: true,
        path: 'Bionutrient > Labs',
        email: 'teravestdan@gmail.com',
        name: 'Dan TerAvest',
        connectedFarms: [
          {
            instanceName: 'dan_teravest_farm.farmos.net',
            owner: true,
            _id: '628bd0a08d7c284adc0542ce',
            groups: [
              {
                groupId: '628bd0a08d7c284adc0542c2',
                path: 'Bionutrient > Labs',
              },
            ],
          },
          {
            instanceName: 'lees_farm.farmos.net',
            owner: true,
            _id: '628bd0a08d7c284adc0542d0',
            groups: [
              {
                groupId: '628bd0a08d7c284adc0542c2',
                path: 'Bionutrient > Labs',
              },
              {
                groupId: '628bd0a08d7c284adc0542c3',
                path: 'Bionutrient > Labs > Michigan',
              },
            ],
          },
          {
            instanceName: 'ourscinet.farmos.net',
            owner: false,
            _id: '628bd0a08d7c284adc0542d3',
            groups: [
              {
                groupId: '628bd0a08d7c284adc0542c2',
                path: 'Bionutrient > Labs',
              },
              {
                groupId: '628bd0a08d7c284adc0542c3',
                path: 'Bionutrient > Labs > Michigan',
              },
              {
                groupId: '628bd0a08d7c284adc0542c4',
                path: 'Bionutrient > Labs > Europe',
              },
              {
                groupId: '628bd0a08d7c284adc0542c5',
                path: 'Bionutrient > Labs > Community',
              },
              {
                groupId: '628bd0a08d7c284adc0542c6',
                path: 'Bionutrient > Labs > Community > Lab',
              },
            ],
          },
          {
            instanceName: 'coffeeshop.farmos.net',
            owner: false,
            _id: '628bd0a08d7c284adc0542d9',
            groups: [
              {
                groupId: '628bd0a08d7c284adc0542c3',
                path: 'Bionutrient > Labs > Michigan',
              },
            ],
          },
        ],
        userId: '628bd0a08d7c284adc0542c7',
      },
      {
        group: '628bd0a08d7c284adc0542c2',
        admin: false,
        path: 'Bionutrient > Labs',
        email: 'djole2352@gmail.com',
        name: 'Dave Jole',
        connectedFarms: [],
        userId: '628bd0a08d7c284adc0542c9',
      },
      {
        group: '628bd0a08d7c284adc0542c3',
        admin: false,
        path: 'Bionutrient > Labs > Michigan',
        email: 'bigjenny@bj.net',
        name: 'Jenny Jennerson',
        connectedFarms: [
          {
            instanceName: 'jennybigfarmstand.farmos.net',
            owner: true,
            _id: '628bd0a08d7c284adc0542db',
            groups: [
              {
                groupId: '628bd0a08d7c284adc0542c3',
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
        _id: '629f51bc52b2600e34e26fec',
      },
      {
        groupId: '628bd0a08d7c284adc0542c3',
        instanceName: 'external2.farmos.net',
        path: 'Bionutrient > Labs > Michigan',
        _id: '629f51bc52b2600e34e26ff1',
      },
    ],
  },
  unifomMembers() {
    this.returnedData.members.forEach((el) => {
      if (el.connectedFarms[0] == undefined) {
        el.connectedFarms.push({});
      }
    });
    this.returnedData.nonMembers.forEach((el) => {
      // without this if-check, we have an infinite loop
      if (!el.connectedFarms) {
        el.connectedFarms = [];
        let groups = [];
        el.connectedFarms.push({ instanceName: el.instanceName, groups: groups });
        this.returnedData.members.push(el);
      }
    });
    return this.returnedData;
  },
};
