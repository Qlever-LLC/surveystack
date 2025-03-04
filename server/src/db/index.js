import { MongoClient, ObjectId } from 'mongodb';

/**
 * @type {Db}
 */
let db = null;

/**
 * @type {MongoClient}
 */
let mongoClient = null;

export const COLL_ACCESS_CODES = 'users.accesscodes';
export const COLL_USERS = 'users';
export const COLL_GROUPS_HYLO_MAPPINGS = 'groups.hylo-mappings'; // TODO rename to prural?

/**
 * https://stackoverflow.com/a/33780894
 * https://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html#mongoclient-connection-pooling
 */
const connectDatabase = async () => {
  const url = process.env.DATABASE_URL;
  const dbName = process.env.DATABASE_NAME;
  mongoClient = new MongoClient(url, { maxPoolSize: 10, useNewUrlParser: true });
  await mongoClient.connect();
  db = mongoClient.db(dbName);
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  // may want unique compound index for dir & slug too
  await db.collection('groups').createIndex({ path: 1 }, { unique: true });
  // submission indexes
  await db.collection('submissions').createIndex({ 'meta.dateCreated': 1 });
  await db.collection('submissions').createIndex({ 'meta.survey.id': 1 });
  await db.collection('submissions').createIndex({ 'meta.survey.version': 1 });
  await db.collection('submissions').createIndex({ 'meta.creator': 1 });

  // delete expired access codes from the DB automatically
  await db.collection(COLL_ACCESS_CODES).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  // make sure that tokens are unique
  await db.collection(COLL_ACCESS_CODES).createIndex({ code: 1 }, { unique: true });

  await db.collection('farmos-instances').createIndex({ userId: 1 });
  await db.collection('farmos-instances').createIndex({ instanceName: 1 });

  await db.collection('farmos-instance-notes').createIndex({ instanceName: 1 }, { unique: true });

  await db.collection(COLL_GROUPS_HYLO_MAPPINGS).createIndex({ groupId: 1 }, { unique: true });

  const farmOsWebhookRequestsCollectionName = 'farmos.webhookrequests';
  const farmOsWebhookRequestsCollectionExists = await db
    .listCollections({ name: farmOsWebhookRequestsCollectionName })
    .hasNext();
  if (!farmOsWebhookRequestsCollectionExists) {
    await db.createCollection(farmOsWebhookRequestsCollectionName, {
      capped: true,
      size: 10000,
      max: 5000,
    });
  }
  const resourcesCollectionName = 'resources';
  const resourcesCollectionExists = await db
    .listCollections({ name: resourcesCollectionName })
    .hasNext();
  if (!resourcesCollectionExists) {
    await db.createCollection(resourcesCollectionName);
  }

  // migrations
  await migrateScripts_V1toV2();
  await migrateSurveys_VXtoV4();
  await migrateGroups_VXtoV2();
  await migrateLibraryIds();
  await migrateResourceLibraryIds();
  await migrateSurveyPrintOptions_VXtoV5();
  await migrateSurveyControlPrintLayout_VXtoV6();
  await migrateSurveyOntologyOptions_VXtoV7();
  await migrateSurveyControlPrintLayout_VXtoV9();
  await migrateSurveyMetaReviewPage_VXtoV10();
  await migrateSubmissions_VXtoV4();
  await migrateSurveyMetaSubmissions_VXtoV11();
};

/*
  Set all existing submissions to not be drafts (isDraft = false),
  because prior to this migration all submissions
  in the database are *submitted* submissions. Soon
  after this migration, we will be persisting drafts
  in the database within the submissions collection.

  Set isDeletedDraft to false because only a submission with isDraft = true
  can have isDeletedDraft = true, and no submissions are drafts at this point.

  Set status to an empty array. Prior to this migration, the only status that
  can exist in the status array has type 'READY_TO_SUBMIT'. That status is added
  by the client when submitting a draft/submission. Prior to this migration,
  that status is never used in any server logic, nor is it needed by the client once
  the submission is persisted to the server, so we can remove it.

  Soon after this migration, the server will have logic that behaves differently 
  depending on if a submission coming in on a request has status READY_TO_SUBMIT.
  In these cases, the server will process the submission according to the
  READY_TO_SUBMIT status, and then remove the status before persisting the submission
  to the database. That doesn't really matter for this migration, but is a bit of
  additional context.
*/
const migrateSubmissions_VXtoV4 = async () => {
  const updateResult = await db.collection('submissions').updateMany(
    { 'meta.specVersion': { $lte: 3 } },
    {
      $set: {
        'meta.specVersion': 4,
        'meta.isDraft': false,
        'meta.isDeletedDraft': false,
        'meta.status': [],
      },
    }
  );
  if (updateResult.modifiedCount) {
    console.log('migrateSubmissions_VXtoV4: Updated', updateResult.modifiedCount, 'submissions');
  }
};

const migrateScripts_V1toV2 = async () => {
  const updateResult = await db.collection('scripts').updateMany({ specVersion: 1 }, [
    {
      $set: {
        meta: {
          dateCreated: { $toDate: '$_id' }, // create Date from id
          dateModified: null,
          revision: 1,
          creator: null,
          group: { id: null, path: null },
          specVersion: 2, // new specVersion
        },
      },
    },
    {
      $unset: 'specVersion', // specVersion is now under meta.specVersion and updated to version 2
    },
  ]);
  if (updateResult.modifiedCount > 0) {
    console.log('Migration: updated this many scripts:', updateResult.modifiedCount);
  }
};

const migrateSurveys_VXtoV4 = async () => {
  const surveys = await db
    .collection('surveys')
    .find({ 'meta.specVersion': { $lte: 3 } })
    .toArray();

  if (surveys.length === 0) {
    return;
  }

  console.log('migrateSurveys_VXtoV4: migrating surveys: ', surveys.length);

  for (const survey of surveys) {
    console.log(`Migrating: ${survey.name}`);

    for (const revision of survey.revisions) {
      console.log(`  Revision`);

      for (const control of revision.controls) {
        migrateSurveys_VXtoV4_control(control);
      }
    }

    survey.meta.specVersion = 4;
    await db.collection('surveys').updateOne(
      { _id: survey._id },
      {
        $set: {
          revisions: survey.revisions,
          'meta.specVersion': 4,
        },
      }
    );
  }
};

const migrateSurveys_VXtoV4_control = (control, depth = 0) => {
  console.log(`    ${'  '.repeat(depth)}${control.name}`);

  const newLabel = control.title || '';
  const newHint = control.label || '';
  const newMoreInfo = control.hint || '';

  control.label = newLabel;
  control.hint = newHint;
  control.moreInfo = newMoreInfo;

  delete control.title;

  if (control.children && control.children.length > 0) {
    for (const child of control.children) {
      migrateSurveys_VXtoV4_control(child, depth + 1);
    }
  }
};

const migrateGroups_VXtoV2 = async () => {
  const updateResult = await db.collection('groups').updateMany({ 'meta.specVersion': null }, [
    {
      $set: {
        meta: {
          archived: { $ifNull: ['$archived', false] },
          specVersion: 2,
          invitationOnly: true,
        },
      },
    },
    {
      $unset: 'archived',
    },
  ]);

  if (updateResult.modifiedCount > 0) {
    console.log('Migration: updated this many groups:', updateResult.modifiedCount);
  }
};

const migrateLibraryIds = async () => {
  const surveys = await db
    .collection('surveys')
    .find({
      $and: [
        { 'revisions.controls.libraryId': { $exists: true } },
        { 'revisions.controls.libraryId': { $not: { $type: 'objectId' } } },
      ],
    })
    .toArray();

  let modifiedCount = 0;

  for (const survey of surveys) {
    for (const revision of survey.revisions) {
      for (const control of revision.controls) {
        if (control.libraryId && ObjectId.isValid(control.libraryId)) {
          await changeLibraryIdToObjectId(control);
        }
      }
    }

    await db.collection('surveys').findOneAndUpdate(
      { _id: new ObjectId(survey._id) },
      { $set: survey },
      {
        returnDocument: 'after',
      }
    );

    modifiedCount++;

    console.log(`Migrated control.library to objectId of survey: ${survey.name}`);
  }

  if (modifiedCount > 0) {
    console.log('Migrated control.library to objectId of this many surveys:', modifiedCount);
  }
};

const changeLibraryIdToObjectId = async (control) => {
  if (control.libraryId && ObjectId.isValid(control.libraryId)) {
    control.libraryId = ObjectId(control.libraryId);
  }

  if (control.children && control.children.length > 0) {
    for (const child of control.children) {
      await changeLibraryIdToObjectId(child);
    }
  }
};

const migrateResourceLibraryIds = async () => {
  const surveys = await db
    .collection('surveys')
    .find({
      $and: [
        { 'resources.libraryId': { $exists: true } },
        { 'resources.libraryId': { $not: { $type: 'objectId' } } },
      ],
    })
    .toArray();

  let modifiedCount = 0;

  for (const survey of surveys) {
    for (const resource of survey.resources) {
      if (resource.libraryId && ObjectId.isValid(resource.libraryId)) {
        resource.libraryId = ObjectId(resource.libraryId);
      }
    }

    await db.collection('surveys').findOneAndUpdate(
      { _id: new ObjectId(survey._id) },
      { $set: survey },
      {
        returnDocument: 'after',
      }
    );

    modifiedCount++;

    console.log(`Migrated resource.library to objectId of survey: ${survey.name}`);
  }

  if (modifiedCount > 0) {
    console.log('Migrated resource.library to objectId of this many surveys', modifiedCount);
  }
};

const migrateSurveyPrintOptions_VXtoV5 = async () => {
  let modifiedCount = 0;

  // Insert print options if doesn't have one
  let res = await db.collection('surveys').updateMany(
    {
      'meta.specVersion': { $lte: 4 },
      options: { $eq: null },
      'meta.printOptions': { $eq: null },
    },
    [
      {
        $set: {
          'meta.specVersion': 5,
          'meta.printOptions': {
            showInstruction: true,
            showUnanswered: false,
          },
        },
      },
    ]
  );
  modifiedCount += res.modifiedCount;

  // Move `survey.options` to `survey.meta.printOptions`
  res = await db.collection('surveys').updateMany(
    {
      'meta.specVersion': { $lte: 4 },
      options: { $ne: null },
    },
    [
      {
        $set: {
          'meta.specVersion': 5,
          'meta.printOptions': '$options',
        },
      },
      {
        $unset: 'options',
      },
    ]
  );
  modifiedCount += res.modifiedCount;

  if (modifiedCount > 0) {
    console.log(
      'Migrated `survey.options` to `survey.meta.printOptions` for many surveys:',
      modifiedCount
    );
  }
};

const migrateSurveyControlPrintLayout_VXtoV6 = async () => {
  const surveys = await db
    .collection('surveys')
    .find({ 'meta.specVersion': { $lte: 5 } })
    .toArray();

  let modifiedCount = 0;

  for (const survey of surveys) {
    let modifiedControlsCount = 0;
    for (const revision of survey.revisions) {
      for (const control of revision.controls) {
        modifiedControlsCount += addControlPrintLayout(control);
      }
    }

    if (modifiedControlsCount === 0) {
      await db
        .collection('surveys')
        .findOneAndUpdate(
          { _id: new ObjectId(survey._id) },
          { $set: { 'meta.specVersion': 6 } },
          { returnDocument: 'after' }
        );

      continue;
    }

    survey.meta.specVersion = 6;

    await db
      .collection('surveys')
      .findOneAndUpdate(
        { _id: new ObjectId(survey._id) },
        { $set: survey },
        { returnDocument: 'after' }
      );

    modifiedCount++;

    console.log('Migrated `control.options.printLayout` to the survey:', survey.name);
  }

  if (modifiedCount > 0) {
    console.log('Migrated `control.options.printLayout` to many surveys:', modifiedCount);
  }
};

const addControlPrintLayout = (control) => {
  if (control.options.printLayout) {
    return 0;
  }

  const printLayout = {};
  if (control.type === 'matrix') {
    printLayout.table = true;
  } else if (control.type === 'file' || control.type === 'image') {
    printLayout.preview = false;
  } else if (/select/i.test(control.type) || control.type === 'ontology') {
    printLayout.showAll = false;
    printLayout.hideList = false;
    printLayout.columns = 3;
  }

  if (Object.keys(printLayout).length > 0) {
    control.options.printLayout = printLayout;
    return 1;
  }

  if (Array.isArray(control.children)) {
    let modifiedCount = 0;
    for (const child of control.children) {
      modifiedCount += addControlPrintLayout(child);
    }
    return modifiedCount;
  }

  return 0;
};

// https://gitlab.com/OpenTEAM1/draft-tech-feedback/-/issues/56
const migrateSurveyOntologyOptions_VXtoV7 = async () => {
  const surveys = await db
    .collection('surveys')
    .find({ 'meta.specVersion': { $lte: 6 } })
    .toArray();

  let modifiedCount = 0;

  for (const survey of surveys) {
    let modifiedControlsCount = 0;
    for (const revision of survey.revisions) {
      for (const control of revision.controls) {
        modifiedControlsCount += addOntologyAutocompleteOption(control);
      }
    }

    if (modifiedControlsCount === 0) {
      await db
        .collection('surveys')
        .findOneAndUpdate(
          { _id: new ObjectId(survey._id) },
          { $set: { 'meta.specVersion': 7 } },
          { returnDocument: 'after' }
        );

      continue;
    }

    survey.meta.specVersion = 7;

    await db
      .collection('surveys')
      .findOneAndUpdate(
        { _id: new ObjectId(survey._id) },
        { $set: survey },
        { returnDocument: 'after' }
      );

    modifiedCount++;

    console.log('Migrated dropdown options to the survey:', survey.name);
  }

  if (modifiedCount > 0) {
    console.log('Migrated dropdown options to many surveys:', modifiedCount);
  }
};

const addOntologyAutocompleteOption = (control) => {
  // Skip if already set
  if (typeof control.options.allowAutocomplete === 'boolean') {
    return 0;
  }

  // Add `options.allowAutocomplete if ontology
  if (control.type === 'ontology') {
    control.options.allowAutocomplete = control.options.allowCustomSelection || false;
    return 1;
  }

  // 1. Add `autocomplete`, `custom` option if `dropdown`
  // 2. Add `autocomplete` option, replace type with `dropdown` if `autocomplete`
  if (control.type === 'matrix') {
    let isModified = false;
    for (const content of control.options.source.content) {
      // Already set
      if (typeof content.custom === 'boolean' && typeof content.autocomplete === 'boolean') {
        continue;
      }

      if (content.type === 'dropdown') {
        content.custom = false;
        content.autocomplete = false;
      } else if (content.type === 'autocomplete') {
        content.type = 'dropdown';
        content.autocomplete = true;
      } else {
        continue;
      }

      if (!isModified) {
        isModified = true;
      }
    }

    return isModified ? 1 : 0;
  }

  if (Array.isArray(control.children)) {
    let modifiedCount = 0;
    for (const child of control.children) {
      modifiedCount += addOntologyAutocompleteOption(child);
    }
    return modifiedCount;
  }

  return 0;
};

// https://gitlab.com/our-sci/software/surveystack/-/issues/253
const migrateSurveyControlPrintLayout_VXtoV9 = async () => {
  const surveys = await db
    .collection('surveys')
    .find({ 'meta.specVersion': { $lte: 8 } })
    .toArray();

  let modifiedCount = 0;

  for (const survey of surveys) {
    let modifiedControlsCount = 0;
    for (const revision of survey.revisions) {
      for (const control of revision.controls) {
        modifiedControlsCount += changePrintLayoutShowAllOptionName(control);
      }
    }

    if (modifiedControlsCount === 0) {
      await db
        .collection('surveys')
        .findOneAndUpdate(
          { _id: new ObjectId(survey._id) },
          { $set: { 'meta.specVersion': 9 } },
          { returnDocument: 'after' }
        );

      continue;
    }

    survey.meta.specVersion = 9;

    await db
      .collection('surveys')
      .findOneAndUpdate(
        { _id: new ObjectId(survey._id) },
        { $set: survey },
        { returnDocument: 'after' }
      );

    modifiedCount++;

    console.log('Migrated print layout options of control to the survey:', survey.name);
  }

  if (modifiedCount > 0) {
    console.log('Migrated print layout options of control to many surveys:', modifiedCount);
  }
};

/*
 *   control.options.printLayout.hideList => (invert) control.options.printLayout.showAllOptionsPrintable
 *   control.options.printLayout.showAll => control.options.printLayout.showAllOptions
 */
const changePrintLayoutShowAllOptionName = (control) => {
  if (/select/i.test(control.type) || control.type === 'ontology') {
    control.options.printLayout.showAllOptionsPrintable = !control.options.printLayout.hideList;
    control.options.printLayout.showAllOptions = control.options.printLayout.showAll;
    delete control.options.printLayout.hideList;
    delete control.options.printLayout.showAll;
    return 1;
  }

  if (Array.isArray(control.children)) {
    let modifiedCount = 0;
    for (const child of control.children) {
      modifiedCount += changePrintLayoutShowAllOptionName(child);
    }
    return modifiedCount;
  }

  return 0;
};

// https://gitlab.com/our-sci/software/json_schema_distribution/-/issues/113
const migrateSurveyMetaReviewPage_VXtoV10 = async () => {
  const updateResult = await db
    .collection('surveys')
    .updateMany({ 'meta.specVersion': { $lte: 9 } }, [
      {
        $set: {
          'meta.reviewPage': false,
          'meta.specVersion': 10,
        },
      },
    ]);

  if (updateResult.modifiedCount) {
    console.log(
      'migrateSurveyMetaReviewPage_VXtoV10: Updated',
      updateResult.modifiedCount,
      'surveys'
    );
  }
};

const migrateSurveyMetaSubmissions_VXtoV11 = async () => {
  const updateResult = await db
    .collection('surveys')
    .updateMany({ 'meta.specVersion': { $lte: 10 } }, [
      {
        $set: {
          'meta.specVersion': 11,
          'meta.submissions': {
            $cond: {
              if: { $eq: ['$meta.submissions', 'user'] },
              then: 'public',
              else: '$meta.submissions',
            },
          },
        },
      },
    ]);

  if (updateResult.modifiedCount) {
    console.log(
      'migrateSurveyMetaSubmissions_VXtoV11: Updated',
      updateResult.modifiedCount,
      'surveys'
    );
  }
};

export const getDb = () => db;
export const disconnect = async () => await mongoClient.close();

export { db, connectDatabase, mongoClient };
