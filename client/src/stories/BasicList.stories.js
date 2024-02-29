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
    template: '<basic-list v-bind="args" />',
  }),
  args: {
    //👇 The args you need here will depend on your component
    listCard: true,
    entities: entityType.surveys,
    enableFav: true,
  },
};

export const BasicListCard_Scripts = {
  render: (args) => ({
    components: { BasicList },
    setup() {
      return { args };
    },
    template: '<basic-list v-bind="args" />',
  }),
  args: {
    listCard: true,
    entities: entityType.scripts,
  },
};

export const BasicListCard_QuestionsLibrary = {
  render: (args) => ({
    components: { BasicList },
    setup() {
      return { args };
    },
    template: '<basic-list v-bind="args" />',
  }),
  args: {
    listCard: true,
    entities: entityType.questionsLibrary,
  },
};

export const BasicListRow = {
  render: (args) => ({
    components: { BasicList },
    setup() {
      return { args };
    },
    template: '<basic-list style="background-color: lightgreen" v-bind="args" />',
  }),
  args: {
    entities: entityType.surveys,
  },
};
