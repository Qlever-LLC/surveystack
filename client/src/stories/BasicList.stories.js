import BasicList from '../components/ui/BasicList2.vue';

import * as entityType from './common/entities_data';

export default {
  component: BasicList,
};

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const BasicListCard_Survey = {
  render: (args) => ({
    components: { BasicList },
    setup() {
      return { args };
    },
    template: `<basic-list v-bind="args"> 
      <template v-slot:title>
        <a-icon class="mr-2"> mdi-cube-outline </a-icon>
        Surveys
      </template>
    </basic-list>`,
  }),
  args: {
    //👇 The args you need here will depend on your component
    listCard: true,
    entities: entityType.surveys,
    enablePinned: true,
    buttonNew: { title: 'Create new Survey', link: '/url' },
    menu: [
      { title: 'Start Survey', icon: 'mdi-open-in-new', action: () => `/url`, color: 'green' },
      { title: 'Start Survey as Member', icon: 'mdi-open-in-new', action: () => `/url` },
      { title: 'Call for Submissions', icon: 'mdi-bullhorn', action: () => `/url` },
      { title: 'Edit', icon: 'mdi-pencil', action: () => `/url` },
      { title: 'View Survey', icon: 'mdi-file-document', action: () => `/url` },
      { title: 'View Results', icon: 'mdi-chart-bar', action: () => `/url` },
      { title: 'Copy to new Survey', icon: 'mdi-content-copy', action: () => `/url` },
      { title: 'Share', icon: 'mdi-share', action: () => `/url` },
      { title: 'Delete', icon: 'mdi-delete', action: () => `/url`, color: 'red' },
    ],
  },
};

export const BasicListCard_Scripts = {
  render: (args) => ({
    components: { BasicList },
    setup() {
      return { args };
    },
    template: `<basic-list v-bind="args"> 
      <template v-slot:title>
        <a-icon class="mr-2"> mdi-code-tags </a-icon>
        Scripts
      </template>
    </basic-list>`,
  }),
  args: {
    listCard: true,
    entities: entityType.scripts,
    buttonNew: { title: 'Create new Script', link: '/url' },
    menu: [
      { title: 'Edit', icon: 'mdi-pencil', action: () => `/url`, color: 'green' },
      { title: 'View Surveys using this Script', icon: 'mdi-chart-bar', action: () => `/url` },
      { title: 'Delete', icon: 'mdi-delete', action: () => `/url`, color: 'red' },
    ],
  },
};

export const BasicListCard_QuestionsLibrary = {
  render: (args) => ({
    components: { BasicList },
    setup() {
      return { args };
    },
    template: `<basic-list v-bind="args"> 
      <template v-slot:title>
        <a-icon class="mr-2"> mdi-cube-outline </a-icon>
        Question Sets
      </template>
    </basic-list>`,
  }),
  args: {
    listCard: true,
    entities: entityType.questionsLibrary,
    buttonNew: { title: 'Create new Question Set', link: '/url' },
    menu: [
      { title: 'Edit', icon: 'mdi-pencil', action: () => `/url`, color: 'green' },
      { title: 'View Results', icon: 'mdi-chart-bar', action: () => `/url` },
      { title: 'Add to new Survey', icon: 'mdi-content-copy', action: () => `/url` },
      { title: 'Delete', icon: 'mdi-delete', action: () => `/url`, color: 'red' },
    ],
  },
};

export const BasicListCard_Groups = {
  render: (args) => ({
    components: { BasicList },
    setup() {
      return { args };
    },
    template: `<basic-list v-bind="args"> 
      <template v-slot:title>
        <a-icon class="mr-2"> mdi-compass-outline </a-icon>
        All My Groups
        <a-avatar class="ml-4" color="grey" rounded="lg" size="30"> {{args.entities.length}} </a-avatar>
      </template>
      <template v-slot:noValue> No Groups yet </template>
    </basic-list>`,
  }),
  args: {
    listCard: true,
    entities: entityType.groups,
    groupStyle: true,
    buttonNew: { title: 'Create a Group', link: '/url' },
    menu: [
      { title: 'Go to Group', icon: 'mdi-open-in-new', action: () => `/url`, color: 'green' },
      { title: 'View Survey', icon: 'mdi-file-document', action: () => `/url` },
      { title: 'Settings', icon: 'mdi-pencil', action: () => `/url` },
      { title: 'Manage Members', icon: 'mdi-account-outline', action: () => `/url` },
    ],
  },
};

export const BasicListRow_Submissions = {
  render: (args) => ({
    components: { BasicList },
    setup() {
      return { args };
    },
    template: `<basic-list v-bind="args"> 
      <template v-slot:title>
        <a-icon class="mr-2"> mdi-file-document </a-icon>
        My Submissions 
        <a-avatar class="ml-4" color="grey" rounded="lg" size="30"> {{args.entities.length}} </a-avatar>
      </template>
    </basic-list>`,
  }),
  args: {
    entities: entityType.submissions,
    submissions: true,
    menu: [
      { title: 'todo', icon: 'mdi-open-in-new', action: () => `/url`, color: 'green' },
      { title: 'todo', icon: 'mdi-file-document', action: () => `/url` },
      { title: 'todo', icon: 'mdi-pencil', action: () => `/url` },
      { title: 'todo', icon: 'mdi-account-outline', action: () => `/url` },
    ],
  },
};

export const BasicListRow_Drafts = {
  render: (args) => ({
    components: { BasicList },
    setup() {
      return { args };
    },
    template: `<basic-list v-bind="args"> 
      <template v-slot:title>
        <a-icon class="mr-2"> mdi-file-document </a-icon>
        My Submissions 
        <a-avatar class="ml-4" color="grey" rounded="lg" size="30"> {{args.entities.length}} </a-avatar>
      </template>
      <template v-slot:preMenu>
         <a-progress-linear color="green" model-value="20" :height="10" rounded :indeterminate="false" />
      </template>
    </basic-list>`,
  }),
  args: {
    entities: entityType.drafts,
    drafts: true,
    menu: [
      { title: 'todo', icon: 'mdi-open-in-new', action: () => `/url`, color: 'green' },
      { title: 'todo', icon: 'mdi-file-document', action: () => `/url` },
      { title: 'todo', icon: 'mdi-pencil', action: () => `/url` },
      { title: 'todo', icon: 'mdi-account-outline', action: () => `/url` },
    ],
  },
};

export const BasicListRow_Results = {
  render: (args) => ({
    components: { BasicList },
    setup() {
      return { args };
    },
    template: `<basic-list v-bind="args"> 
    <a-icon v-if="entity.role === 'admin'">mdi-crown-outline</a-icon>
    </basic-list>`,
  }),
  args: {
    entities: entityType.results,
    showTitle: false,
    menu: [
      { title: 'todo', icon: 'mdi-open-in-new', action: () => `/url`, color: 'green' },
      { title: 'todo', icon: 'mdi-file-document', action: () => `/url` },
      { title: 'todo', icon: 'mdi-pencil', action: () => `/url` },
      { title: 'todo', icon: 'mdi-account-outline', action: () => `/url` },
    ],
  },
};

export const BasicListRow_Members = {
  render: (args) => ({
    components: { BasicList },
    setup() {
      return { args };
    },
    template: `<basic-list v-bind="args"> 
    <template v-slot:title>
        <a-icon class="mr-2"> mdi-account-multiple </a-icon>
        Members
      </template>
    </basic-list>`,
  }),
  args: {
    entities: entityType.members,
    buttonNew: { title: 'Invite New Members', link: '/url' },
    members: true,
  },
};
