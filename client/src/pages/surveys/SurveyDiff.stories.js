import SurveyDiff from './SurveyDiff.vue';
import { createSurvey } from '@/utils/surveys';
import { createControlInstance } from '@/utils/surveyConfig';
import _ from 'lodash';

const createRevision = (version = 1) => ({ ...createSurvey({}).revisions[0], version });

// More on default export: https://storybook.js.org/docs/vue/writing-stories/introduction#default-export
export default {
  title: 'Example/SurveyDiff',
  component: SurveyDiff,
  // More on argTypes: https://storybook.js.org/docs/vue/api/argtypes
  argTypes: {
    oldRevision: 'object',
    newRevision: 'object',
    defaultOpen: Boolean,
  },
};

// More on component templates: https://storybook.js.org/docs/vue/writing-stories/introduction#using-args
const Template = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { SurveyDiff },
  template: '<survey-diff v-bind="$props" />',
});
const buildStory = (args) => {
  const template = Template.bind({});
  template.args = args();
  return template;
};

export const Simple = buildStory(() => {
  const oldRevision = createRevision(1);
  oldRevision.controls.push(
    createControlInstance({ type: 'number', name: 'number_1' }),
    createControlInstance({ type: 'string', name: 'string_1' }),
    createControlInstance({
      type: 'page',
      name: 'page_1',
      children: [
        createControlInstance({ type: 'number', name: 'number_2' }),
        createControlInstance({ type: 'string', name: 'string_2' }),
      ],
    })
  );

  const newRevision = _.cloneDeep(oldRevision);
  newRevision.controls[0].name = 'changed_name';
  newRevision.controls[2].children[0].options.readOnly = true;
  newRevision.controls.splice(1, 1);
  newRevision.controls.unshift(createControlInstance({ type: 'number', name: 'number_3' }));

  return {
    oldRevision,
    newRevision,
    defaultOpen: true,
    showUnchangeds: false,
  };
});

export const Matrix = buildStory(() => {
  const oldRevision = createRevision(1);
  oldRevision.controls.push(
    createControlInstance({ type: 'matrix', name: 'matrix_1' }),
    createControlInstance({
      type: 'page',
      name: 'page_1',
      children: [createControlInstance({ type: 'matrix', name: 'matrix_2' })],
    })
  );

  const newRevision = _.cloneDeep(oldRevision);
  newRevision.controls[0].name = 'changed_name';
  newRevision.controls[0].options.source.content[0].label = 'Col One';
  newRevision.controls[0].options.source.content[0].type = 'text';
  newRevision.controls[1].children[0].options.readOnly = true;
  newRevision.controls[1].children[0].options.source.content[0].label = 'First Col';
  newRevision.controls[1].children[0].options.source.content[0].type = 'text';
  newRevision.controls[1].children[0].options.source.content[0].scaleWidth = 120;
  newRevision.controls[1].children[0].options.source.content[1].multiple = true;

  return {
    oldRevision,
    newRevision,
    defaultOpen: true,
    showUnchangeds: false,
  };
});
