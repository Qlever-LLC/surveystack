import { MongoClient, Db, ObjectId } from 'mongodb';

/**
 * @type {Db}
 */
let db = null;

/**
 * https://stackoverflow.com/a/33780894
 * https://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html#mongoclient-connection-pooling
 */
const connectDatabase = async () => {
  const url = process.env.DATABASE_URL;
  const dbName = process.env.DATABASE_NAME;
  const client = new MongoClient(url, { poolSize: 10, useNewUrlParser: true });
  await client.connect();
  db = client.db(dbName);
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  // may want unique compound index for dir & slug too
  await db.collection('groups').createIndex({ path: 1 }, { unique: true });
  // submission indexes
  await db.collection('submissions').createIndex({ 'meta.dateCreated': 1 });
  await db.collection('submissions').createIndex({ 'meta.survey.id': 1 });
  await db.collection('submissions').createIndex({ 'meta.survey.version': 1 });
  await db.collection('submissions').createIndex({ 'meta.creator': 1 });
  await db.createCollection('farmos.webhookrequests', { capped: true, size: 10000, max: 5000 });

  // migrations
  await migrateScripts_V1toV2();
  //await migrateSurveys_VXtoV4();
};

const migrateScripts_V1toV2 = async () => {
  const r = await db.collection('scripts').updateMany({ specVersion: 1 }, [
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
  if (r.modifiedCount > 0) {
    console.log('Migration: updated this many scripts:', r.modifiedCount);
  }
};

const migrateSurveys_VXtoV4 = async () => {
  const surveys = await db
    .collection('surveys')
    .find({ 'meta.specVersion': { $lte: 3 } })
    .toArray();
  console.log('migrateSurveys_VXtoV4', surveys.length);

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

export { db, connectDatabase };
