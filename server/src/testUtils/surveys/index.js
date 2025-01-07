import {
  createRequestSubmissionFor,
  createSubmissionDocFor,
  createSubmissionWith,
  createPostSubmission,
} from '../submissions';
import getControlGenerator from './controlGenerators';
import { createSurveyMeta, createSurveyMetaGroup, createSurveyMetaPrintOptions } from './meta';
import { createGroup } from '../groups';
const { ObjectId } = jest.requireActual('mongodb');
const { getDb } = jest.requireActual('../../db');

const createSurveyResources = () => [
  {
    id: new ObjectId(),
    label: 'Mock.csv',
    name: 'mockcsv',
    type: 'FILE',
    location: 'REMOTE',
  },
  {
    id: new ObjectId(),
    label: 'Mock Dropdown Items',
    name: 'mock_dropdown_items',
    type: 'ONTOLOGY_LIST',
    location: 'EMBEDDED',
    content: [
      {
        id: new ObjectId(),
        label: 'Item 1',
        value: 'item_1',
        tags: 'item1',
      },
      {
        id: new ObjectId(),
        label: 'Item 2',
        value: 'item_2',
        tags: 'item2',
      },
    ],
  },
  {
    id: new ObjectId(),
    label: 'Mock Resource Name',
    name: 'survey_reference_1',
    type: 'SURVEY_REFERENCE',
    location: 'REMOTE',
    content: {
      id: new ObjectId(),
      version: 1,
      path: 'data.node_1.property_2',
    },
  },
];

const createSurvey = async (
  controls = [],
  { name = 'Mock Survey Name', meta = {}, resources = createSurveyResources() } = {}
) => {
  const now = new Date();
  const group = await createGroup();
  const surveyDoc = {
    name,
    latestVersion: 1,
    meta: createSurveyMeta({
      ...meta,
      dateCreated: now,
      dateModified: now,
      group:
        meta.group ??
        createSurveyMetaGroup({
          id: group._id,
          path: group.path,
        }),
    }),
    resources,
    revisions: [
      {
        dateCreated: now,
        version: 1,
        controls: [],
      },
    ],
  };

  const controlDocs = [];

  controls.forEach((ctrl, index) => {
    const controlGenerator = getControlGenerator(ctrl);

    if (typeof controlGenerator === 'function') {
      controlDocs.push({
        id: new ObjectId(),
        ...controlGenerator({}, index + 1, surveyDoc.resources[1].id),
      });
    }
  });

  if (controlDocs.length > 0) {
    surveyDoc.revisions.push({
      dateCreated: surveyDoc.meta.dateModified,
      version: 2,
      controls: controlDocs,
    });
    surveyDoc.latestVersion = 2;
  }

  const insertResult = await getDb().collection('surveys').insertOne(surveyDoc);
  const survey = { _id: insertResult.insertedId, ...surveyDoc };

  const createRequestSubmission = createRequestSubmissionFor(survey);
  const createSubmissionDoc = createSubmissionDocFor(survey);
  const createSubmission = createSubmissionWith(createSubmissionDoc);
  const postSubmission = createPostSubmission(createRequestSubmission);

  return {
    survey,
    createRequestSubmission,
    createSubmissionDoc,
    createSubmission,
    postSubmission,
  };
};

export {
  createSurvey,
  getControlGenerator,
  createSurveyMeta,
  createSurveyMetaGroup,
  createSurveyMetaPrintOptions,
};
