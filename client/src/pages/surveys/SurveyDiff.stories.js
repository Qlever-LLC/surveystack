import SurveyDiff from './SurveyDiff.vue';
import { createSurvey, updateControls } from '@/utils/surveys';
import { createControlInstance } from '@/utils/surveyConfig';
import _ from 'lodash';
import ObjectId from 'bson-objectid';

const createRevision = (version = 1) => ({ ...createSurvey({}).revisions[0], version });

// More on default export: https://storybook.js.org/docs/vue/writing-stories/introduction#default-export
export default {
  title: 'Example/SurveyDiff',
  component: SurveyDiff,
  // More on argTypes: https://storybook.js.org/docs/vue/api/argtypes
  argTypes: {
    oldControls: 'object',
    newControls: 'object',
    defaultOpen: Boolean,
    useControlPathAsId: Boolean,
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
  const oldControls = [
    createControlInstance({ type: 'number', name: 'number_1' }),
    createControlInstance({ type: 'string', name: 'string_1' }),
    createControlInstance({
      type: 'page',
      name: 'page_1',
      children: [
        createControlInstance({ type: 'number', name: 'number_2' }),
        createControlInstance({ type: 'string', name: 'string_2' }),
      ],
    }),
  ];

  const newControls = _.cloneDeep(oldControls);
  newControls[0].name = 'changed_name';
  newControls[2].children[0].options.readOnly = true;
  newControls.splice(1, 1);
  newControls.unshift(createControlInstance({ type: 'number', name: 'number_3' }));

  return {
    oldControls,
    newControls,
    defaultOpen: true,
    showUnchanged: false,
  };
});

export const Matrix = buildStory(() => {
  const oldControls = [
    createControlInstance({ type: 'matrix', name: 'matrix_1' }),
    createControlInstance({
      type: 'page',
      name: 'page_1',
      children: [createControlInstance({ type: 'matrix', name: 'matrix_2' })],
    }),
  ];

  const newControls = _.cloneDeep(oldControls);
  newControls[0].name = 'changed_name';
  newControls[0].options.source.content[0].label = 'Col One';
  newControls[0].options.source.content[0].type = 'text';
  newControls[1].children[0].options.readOnly = true;
  newControls[1].children[0].options.source.content[0].label = 'First Col';
  newControls[1].children[0].options.source.content[0].type = 'text';
  newControls[1].children[0].options.source.content[0].scaleWidth = 120;
  newControls[1].children[0].options.source.content[1].multiple = true;

  return {
    oldControls,
    newControls,
    defaultOpen: true,
    showUnchanged: false,
  };
});

export const ControlIdsDifferent = buildStory(() => {
  const oldControls = [
    createControlInstance({ type: 'number', name: 'number_1' }),
    createControlInstance({ type: 'string', name: 'string_1' }),
    createControlInstance({
      type: 'page',
      name: 'page_1',
      children: [
        createControlInstance({ type: 'number', name: 'number_2' }),
        createControlInstance({ type: 'string', name: 'string_2' }),
      ],
    }),
  ];

  let newControls = _.cloneDeep(oldControls);
  newControls[0].name = 'changed_name';
  newControls[1].type = 'number';
  newControls[2].children[0].options.readOnly = true;

  // set new ObjectIDs for all controls
  newControls = updateControls(newControls, {
    type: /.*/,
    replacer: ({ id, ...rest }) => ({ id: new ObjectId().toString(), ...rest }),
  });
  // change the type of a control
  // newControls[0] = createControlInstance({ type: 'string', name: newControls[0].name })

  return {
    oldControls,
    newControls,
    defaultOpen: true,
    showUnchanged: false,
    useControlPathAsId: true,
  };
});

// prettier-ignore
const bigRevisions = [{"dateCreated":{"$date":"1970-01-01T00:00:00.000Z"},"version":1,"controls":[{"name":"group_1","label":"My group 1","type":"group","children":[{"name":"instructions_2","label":"Instructions 2","type":"instructions","options":{"readOnly":false,"required":false,"redacted":false,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""},"source":""},"id":"616aa01639562a000163fddf","hint":"","value":null},{"name":"instructions_3","label":"Instructions 3","type":"instructions","options":{"readOnly":false,"required":false,"redacted":false,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""},"source":""},"id":"616aa01839562a000163fde1","hint":"","value":null},{"name":"text_4","label":"Enter some text 4","type":"string","options":{"readOnly":false,"required":false,"redacted":false,"relevance":{"enabled":true,"code":"/**\n * Relevance\n *\n * @param {submission} submission\n * @param {survey} survey\n * @param {parent} parent\n */\nfunction relevance(submission, survey, parent) {\n  return true;\n}\n"},"constraint":{"enabled":true,"code":"/**\n * Constraint\n *\n * @param {submission} submission\n * @param {survey} survey\n * @param {parent} parent\n */\nfunction constraint(submission, survey, parent) {\n  return true;\n}\n"},"calculate":{"enabled":true,"code":"/**\n * Calculate\n *\n * @param {submission} submission\n * @param {survey} survey\n * @param {parent} parent\n */\nfunction calculate(submission, survey, parent) {\n  return true;\n}\n"},"apiCompose":{"enabled":true,"code":"\n/* eslint-disable */\n\n/**\n * ApiCompose\n *\n * @param {submission} submission\n * @param {survey} survey\n * @param {parent} parent\n */\nfunction apiCompose(submission, survey, parent) {\n  const request = populatePlanting(\n    submission.data.crop,\n    submission.data.field,\n  );\n\n  return request;\n}\n\n\n/**\n * Helper function to populate the request\n * @param {*} cropAnswer answer for the planting crop question\n */\n\nfunction populatePlanting(cropAnswer, field) {\n  if (!cropAnswer.value) {\n    throw 'Please select crop';\n  }\n\n  if (!field.value) {\n    throw 'Please select field';\n  }\n\n\n  const crop = cropAnswer.value;\n  const farmUrl = field.value.url;\n\n\n  return {\n    type: 'farmos',\n    farmosType: 'asset',\n    url: farmUrl,\n    body: {\n      name: crop\n      type: 'planting',\n      crop: [{ name: crop }], // crop name\n    },\n  };\n}\n\n\n\n/*\nSimple example to demonstrate how to create a planting on farmos.\n\nThe survey needs one Question for the crop.\n\nOn Farmos a vocabulary entry for the crop will be created of not\nalready existing.\n\nThe ID of the planting will be stored in a submission wide variable\n$PLANTING and will be accessible in logs within other apiCompose functions.\n\n\nThe structure to send to the surveystack-server looks like this:\n\n{\n  \"type\": \"farmos\",\n  \"farmosType\": \"planting\",\n  \"url\": \"ourscitest.farmos.net\",\n  \"body\": {\n    \"crop\": \"potato\",\n}\n\n\nThe apiCompose function is the entry point to code in.\nOther functions may be called within.\n\nHowever, we are in a sandbox here, so no requests\noutside are possible.\n\nuse log() to log to console below\n*/\n"}},"id":"616aa01e39562a000163fde3","hint":"","value":null},{"name":"multiple_choice_5","label":"Multiple Choice 5","type":"selectSingle","options":{"readOnly":false,"required":false,"redacted":true,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""},"source":[{"value":"123","label":"123"},{"value":"123","label":"123"},{"value":"123","label":"123"},{"value":"321","label":"213"}],"allowCustomSelection":true},"id":"616aa02139562a000163fde5","hint":"","value":null}],"options":{"readOnly":false,"required":false,"redacted":true,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""}},"id":"616aa01439562a000163fddd","hint":""},{"name":"script_6","label":"Script 6","type":"script","options":{"readOnly":false,"required":false,"redacted":false,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""}},"id":"616aa07f39562a000163fe05","hint":"","value":null},{"name":"page_7","label":"My page 7","type":"page","children":[{"name":"farmos_planting_8","label":"Farmos Planting 8","type":"farmOsPlanting","options":{"readOnly":false,"required":false,"redacted":false,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""}},"id":"616aa08739562a000163fe0a","hint":"","value":null},{"name":"farmos_field_9","label":"Farmos Field 9","type":"farmOsField","options":{"readOnly":false,"required":false,"redacted":false,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""}},"id":"616aa08939562a000163fe0c","hint":"","value":null},{"name":"farmos_farm_10","label":"Farmos Farm 10","type":"farmOsFarm","options":{"readOnly":false,"required":false,"redacted":false,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""}},"id":"616aa08a39562a000163fe0e","hint":"","value":null}],"options":{"readOnly":false,"required":false,"redacted":false,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""}},"id":"616aa08339562a000163fe08","hint":"","value":null},{"name":"matrix_11","label":"Matrix 11","type":"matrix","options":{"readOnly":false,"required":false,"redacted":false,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""},"source":{"config":{"addRowLabel":"Add row"},"content":[{"label":"Sample","value":"sample","tags":"","type":"number","resource":"","multiple":false,"required":false,"redacted":false,"scaleWidth":100},{"label":"Description","value":"description","tags":"","type":"text","resource":"","multiple":false,"required":false,"redacted":false,"scaleWidth":100}]}},"id":"616aa09339562a000163fe10","hint":"","value":null},{"name":"location_12","label":"Pick Location 12","type":"location","options":{"readOnly":false,"required":false,"redacted":false,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""}},"id":"616aa09d39562a000163fe13","hint":"","value":null},{"name":"checkboxes_13","label":"Checkboxes 13","type":"selectMultiple","options":{"readOnly":false,"required":false,"redacted":false,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""},"source":[]},"id":"616aa09f39562a000163fe15","hint":"","value":null},{"name":"matrix_14","label":"Matrix 14","type":"matrix","options":{"readOnly":false,"required":false,"redacted":false,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""},"source":{"config":{"addRowLabel":"Add row"},"content":[{"label":"Sample","value":"sample","tags":"","type":"number","resource":"","multiple":false,"required":false,"redacted":false,"scaleWidth":100},{"label":"Description","value":"description","tags":"","type":"text","resource":"","multiple":false,"required":false,"redacted":false,"scaleWidth":100}]}},"id":"616aa0a139562a000163fe17","hint":"","value":null}]},{"dateCreated":{"$date":"1970-01-01T00:00:00.000Z"},"version":2,"controls":[{"name":"group_1","label":"My group 1","type":"group","children":[{"name":"instructions_2","label":"Instructions 2","type":"instructions","options":{"readOnly":false,"required":false,"redacted":false,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""},"source":""},"id":"616aa01639562a000163fddf","hint":"","value":null},{"name":"instructions_3","label":"Instructions 3","type":"instructions","options":{"readOnly":false,"required":false,"redacted":false,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""},"source":""},"id":"616aa01839562a000163fde1","hint":"","value":null},{"name":"text_4","label":"Enter some text 4","type":"string","options":{"readOnly":false,"required":true,"redacted":true,"relevance":{"enabled":true,"code":"/**\n * Relevance\n *\n * @param {submission} submission\n * @param {survey} survey\n * @param {parent} parent\n */\nfunction relevance(submission, survey, parent) {\n  return true;\n}\n"},"constraint":{"enabled":true,"code":"/**\n * Constraint\n *\n * @param {submission} submission\n * @param {survey} survey\n * @param {parent} parent\n */\nfunction constraint(submission, survey, parent) {\n  return true;\n}\n"},"calculate":{"enabled":true,"code":"/**\n * Calculate\n *\n * @param {submission} submission\n * @param {survey} survey\n * @param {parent} parent\n */\nfunction calculate(submission, survey, parent) {\n  return true;\n}\n"},"apiCompose":{"enabled":true,"code":"\n/* eslint-disable */\n\n/**\n * ApiCompose\n *\n * @param {submission} submission\n * @param {survey} survey\n * @param {parent} parent\n */\nfunction apiCompose(submission, survey, parent) {\n  const request = populatePlanting(\n    submission.data.crop,\n    submission.data.field,\n  );\n\n  return request;\n}\n\n\n/**\n * Helper function to populate the request\n * @param {*} cropAnswer answer for the planting crop question\n */\n\nfunction populatePlanting(cropAnswer, field) {\n  if (!cropAnswer.value) {\n    throw 'Please select crop';\n  }\n\n  if (!field.value) {\n    throw 'Please select field';\n  }\n\n\n  const crop = cropAnswer.value;\n  const farmUrl = field.value.url;\n\n\n  return {\n    type: 'farmos',\n    farmosType: 'asset',\n    url: farmUrl,\n    body: {\n      name: crop\n      type: 'planting',\n      crop: [{ name: crop }], // crop name\n    },\n  };\n}\n\n\n\n/*\nSimple example to demonstrate how to create a planting on farmos.\n\nThe survey needs one Question for the crop.\n\nOn Farmos a vocabulary entry for the crop will be created of not\nalready existing.\n\nThe ID of the planting will be stored in a submission wide variable\n$PLANTING and will be accessible in logs within other apiCompose functions.\n\n\nThe structure to send to the surveystack-server looks like this:\n\n{\n  \"type\": \"farmos\",\n  \"farmosType\": \"planting\",\n  \"url\": \"ourscitest.farmos.net\",\n  \"body\": {\n    \"crop\": \"potato\",\n}\n\n\nThe apiCompose function is the entry point to code in.\nOther functions may be called within.\n\nHowever, we are in a sandbox here, so no requests\noutside are possible.\n\nuse log() to log to console below\n*/\n"},"enableQr":true},"id":"616aa01e39562a000163fde3","hint":"hihihnt","value":null,"moreInfo":"more info"},{"name":"multiple_choice_5","label":"Multiple Choice 5","type":"selectSingle","options":{"readOnly":false,"required":false,"redacted":true,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""},"source":[{"value":"123","label":"123"},{"value":"123","label":"123"},{"value":"123","label":"123"},{"value":"321","label":"213"}],"allowCustomSelection":true},"id":"616aa02139562a000163fde5","hint":"","value":null}],"options":{"readOnly":false,"required":false,"redacted":true,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""}},"id":"616aa01439562a000163fddd","hint":""},{"name":"script_6","label":"Script 6","type":"script","options":{"readOnly":false,"required":false,"redacted":false,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""}},"id":"616aa07f39562a000163fe05","hint":"","value":null},{"name":"page_7","label":"My page 7","type":"page","children":[{"name":"farmos_planting_8","label":"Farmos Planting 8","type":"farmOsPlanting","options":{"readOnly":false,"required":false,"redacted":true,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""}},"id":"616aa08739562a000163fe0a","hint":"","value":null},{"name":"farmos_field_9","label":"Farmos Field 9","type":"farmOsField","options":{"readOnly":false,"required":false,"redacted":false,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""}},"id":"616aa08939562a000163fe0c","hint":"","value":null},{"name":"farmos_farm_10","label":"Farmos Farm 10","type":"farmOsFarm","options":{"readOnly":false,"required":false,"redacted":false,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""}},"id":"616aa08a39562a000163fe0e","hint":"","value":null}],"options":{"readOnly":false,"required":false,"redacted":true,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""}},"id":"616aa08339562a000163fe08","hint":"","value":null},{"name":"matrix_11","label":"Matrix 11","type":"matrix","options":{"readOnly":false,"required":false,"redacted":false,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""},"source":{"config":{"addRowLabel":"Add row"},"content":[{"label":"Sample","value":"sample","tags":"","type":"number","resource":"","multiple":false,"required":false,"redacted":false,"scaleWidth":100},{"label":"Description","value":"description","tags":"","type":"text","resource":"","multiple":false,"required":false,"redacted":false,"scaleWidth":100}]}},"id":"616aa09339562a000163fe10","hint":"","value":null},{"name":"location_12","label":"Pick Location 12","type":"location","options":{"readOnly":false,"required":false,"redacted":false,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":"/**\n * Constraint\n *\n * @param {submission} submission\n * @param {survey} survey\n * @param {parent} parent\n */\nfunction constraint(submission, survey, parent) {\n  return true;\n}\n"},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""}},"id":"616aa09d39562a000163fe13","hint":"","value":null},{"name":"checkboxes_13","label":"Checkboxes 13","type":"selectMultiple","options":{"readOnly":false,"required":false,"redacted":false,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""},"source":[]},"id":"616aa09f39562a000163fe15","hint":"","value":null},{"name":"matrix_14","label":"Matrix 14","type":"matrix","options":{"readOnly":false,"required":true,"redacted":false,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""},"source":{"config":{"addRowLabel":"Add row"},"content":[{"label":"Sample","value":"sample","tags":"","type":"number","resource":"","multiple":false,"required":false,"redacted":false,"scaleWidth":100},{"label":"Description","value":"description","tags":"","type":"text","resource":"","multiple":false,"required":false,"redacted":false,"scaleWidth":100},{"label":"DROPDOWN","value":"dropdown","tags":"","type":"dropdown","resource":"616c316cb7c6f100016885b9","multiple":true,"custom":false,"required":true,"redacted":false,"scaleWidth":100},{"label":"auto complete","value":"","tags":"","type":"autocomplete","resource":"616c31b9b7c6f100016885e4","multiple":true,"custom":true,"required":false,"redacted":false,"scaleWidth":100},{"label":"textandqr","value":"textand qr","tags":"","type":"qrcode","resource":"","multiple":false,"custom":false,"required":false,"redacted":false,"scaleWidth":100},{"label":"date","value":"date","tags":"","type":"date","resource":"","multiple":false,"custom":false,"required":false,"redacted":true,"scaleWidth":110},{"label":"fos filed","value":"fos filed","tags":"","type":"farmos_field","resource":"","multiple":false,"custom":false,"required":false,"redacted":false,"scaleWidth":100},{"label":"fos planting","value":"fos planting","tags":"","type":"farmos_planting","resource":"","multiple":false,"custom":false,"required":false,"redacted":false,"scaleWidth":100}]}},"id":"616aa0a139562a000163fe17","hint":"","value":null}]},{"dateCreated":{"$date":"1970-01-01T00:00:00.000Z"},"version":3,"controls":[{"name":"group_1","label":"My group 1","type":"group","children":[{"name":"instructions_2","label":"Instructions 2","type":"instructions","options":{"readOnly":false,"required":false,"redacted":false,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""},"source":""},"id":"616aa01639562a000163fddf","hint":"","value":null},{"name":"text_4","label":"Enter some text 4","type":"string","options":{"readOnly":false,"required":true,"redacted":true,"relevance":{"enabled":true,"code":"/**\n * Relevance\n *\n * @param {submission} submission\n * @param {survey} survey\n * @param {parent} parent\n */\nfunction relevance(submission, survey, parent) {\n  return true;\n}\n"},"constraint":{"enabled":true,"code":"/**\n * Constraint\n *\n * @param {submission} submission\n * @param {survey} survey\n * @param {parent} parent\n */\nfunction constraint(submission, survey, parent) {\n  return true;\n}\n"},"calculate":{"enabled":true,"code":"/**\n * Calculate\n *\n * @param {submission} submission\n * @param {survey} survey\n * @param {parent} parent\n */\nfunction calculate(submission, survey, parent) {\n  return true;\n}\n"},"apiCompose":{"enabled":true,"code":"\n/* eslint-disable */\n\n/**\n * ApiCompose\n *\n * @param {submission} submission\n * @param {survey} survey\n * @param {parent} parent\n */\nfunction apiCompose(submission, survey, parent) {\n  const request = populatePlanting(\n    submission.data.crop,\n    submission.data.field,\n  );\n\n  return request;\n}\n\n\n/**\n * Helper function to populate the request\n * @param {*} cropAnswer answer for the planting crop question\n */\n\nfunction populatePlanting(cropAnswer, field) {\n  if (!cropAnswer.value) {\n    throw 'Please select crop';\n  }\n\n  if (!field.value) {\n    throw 'Please select field';\n  }\n\n\n  const crop = cropAnswer.value;\n  const farmUrl = field.value.url;\n\n\n  return {\n    type: 'farmos',\n    farmosType: 'asset',\n    url: farmUrl,\n    body: {\n      name: crop\n      type: 'planting',\n      crop: [{ name: crop }], // crop name\n    },\n  };\n}\n\n\n\n/*\nSimple example to demonstrate how to create a planting on farmos.\n\nThe survey needs one Question for the crop.\n\nOn Farmos a vocabulary entry for the crop will be created of not\nalready existing.\n\nThe ID of the planting will be stored in a submission wide variable\n$PLANTING and will be accessible in logs within other apiCompose functions.\n\n\nThe structure to send to the surveystack-server looks like this:\n\n{\n  \"type\": \"farmos\",\n  \"farmosType\": \"planting\",\n  \"url\": \"ourscitest.farmos.net\",\n  \"body\": {\n    \"crop\": \"potato\",\n}\n\n\nThe apiCompose function is the entry point to code in.\nOther functions may be called within.\n\nHowever, we are in a sandbox here, so no requests\noutside are possible.\n\nuse log() to log to console below\n*/\n"},"enableQr":true},"id":"616aa01e39562a000163fde3","hint":"hihihnt","value":null,"moreInfo":"more info"},{"name":"multiple_choice_5","label":"Multiple Choice 5","type":"selectSingle","options":{"readOnly":false,"required":false,"redacted":true,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""},"source":[{"value":"123","label":"123"},{"value":"123","label":"123"},{"value":"123","label":"123"},{"value":"321","label":"213"}],"allowCustomSelection":true},"id":"616aa02139562a000163fde5","hint":"","value":null}],"options":{"readOnly":false,"required":false,"redacted":true,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""}},"id":"616aa01439562a000163fddd","hint":""},{"name":"script_6","label":"Script 6","type":"script","options":{"readOnly":false,"required":false,"redacted":false,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""}},"id":"616aa07f39562a000163fe05","hint":"","value":null},{"name":"page_7","label":"My page 7","type":"page","children":[{"name":"farmos_planting_8","label":"Farmos Planting 8","type":"farmOsPlanting","options":{"readOnly":false,"required":false,"redacted":true,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""}},"id":"616aa08739562a000163fe0a","hint":"","value":null},{"name":"farmos_field_9","label":"Farmos Field 9","type":"farmOsField","options":{"readOnly":false,"required":false,"redacted":false,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""}},"id":"616aa08939562a000163fe0c","hint":"","value":null},{"name":"farmos_farm_10","label":"Farmos Farm 10","type":"farmOsFarm","options":{"readOnly":false,"required":false,"redacted":false,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""}},"id":"616aa08a39562a000163fe0e","hint":"","value":null}],"options":{"readOnly":false,"required":false,"redacted":true,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""}},"id":"616aa08339562a000163fe08","hint":"","value":null},{"name":"matrix_11","label":"Matrix 11","type":"matrix","options":{"readOnly":false,"required":false,"redacted":false,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""},"source":{"config":{"addRowLabel":"Add row"},"content":[{"label":"Sample","value":"sample","tags":"","type":"number","resource":"","multiple":false,"required":false,"redacted":false,"scaleWidth":100},{"label":"Description","value":"description","tags":"","type":"text","resource":"","multiple":false,"required":false,"redacted":false,"scaleWidth":100}]}},"id":"616aa09339562a000163fe10","hint":"","value":null},{"name":"location_12","label":"Pick Location 12","type":"location","options":{"readOnly":false,"required":false,"redacted":false,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":"/**\n * Constraint\n *\n * @param {submission} submission\n * @param {survey} survey\n * @param {parent} parent\n */\nfunction constraint(submission, survey, parent) {\n  return true;\n}\n"},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""}},"id":"616aa09d39562a000163fe13","hint":"","value":null},{"name":"checkboxes_13","label":"Checkboxes 13","type":"selectMultiple","options":{"readOnly":false,"required":false,"redacted":false,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""},"source":[]},"id":"616aa09f39562a000163fe15","hint":"","value":null},{"name":"matrix_14","label":"Matrix 14","type":"matrix","options":{"readOnly":false,"required":true,"redacted":false,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""},"source":{"config":{"addRowLabel":"Add row"},"content":[{"label":"Sample","value":"sample","tags":"","type":"number","resource":"","multiple":false,"required":false,"redacted":false,"scaleWidth":100},{"label":"Description","value":"description","tags":"","type":"text","resource":"","multiple":false,"required":false,"redacted":false,"scaleWidth":100},{"label":"DROPDOWN","value":"dropdown","tags":"","type":"dropdown","resource":"616c316cb7c6f100016885b9","multiple":true,"custom":false,"required":true,"redacted":false,"scaleWidth":100},{"label":"auto complete","value":"","tags":"","type":"autocomplete","resource":"616c31b9b7c6f100016885e4","multiple":true,"custom":true,"required":false,"redacted":false,"scaleWidth":100},{"label":"textandqr","value":"textand qr","tags":"","type":"qrcode","resource":"","multiple":false,"custom":false,"required":false,"redacted":false,"scaleWidth":100},{"label":"date","value":"date","tags":"","type":"date","resource":"","multiple":false,"custom":false,"required":false,"redacted":true,"scaleWidth":110},{"label":"fos filed","value":"fos filed","tags":"","type":"farmos_field","resource":"","multiple":false,"custom":false,"required":false,"redacted":false,"scaleWidth":100},{"label":"fos planting","value":"fos planting","tags":"","type":"farmos_planting","resource":"","multiple":false,"custom":false,"required":false,"redacted":false,"scaleWidth":100}]}},"id":"616aa0a139562a000163fe17","hint":"","value":null},{"name":"number_11","label":"Enter a number 1","type":"number","options":{"readOnly":false,"required":false,"redacted":false,"relevance":{"enabled":false,"code":""},"constraint":{"enabled":false,"code":""},"calculate":{"enabled":false,"code":""},"apiCompose":{"enabled":false,"code":""}},"id":"616dc72cb990590001c4058d","hint":"","value":null}]}]

export const AllTypes = buildStory(() => {
  return {
    oldControls: bigRevisions[0].controls,
    newControls: bigRevisions[2].controls,
    defaultOpen: true,
    showUnchanged: false,
  };
});
