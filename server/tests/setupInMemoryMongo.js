const { MongoMemoryServer } = require('mongodb-memory-server');
const { connectDatabase, getDb } = require('../src/db');

let mongod;

const CREATE_DB_TIMEOUT = 60000;
// eslint-disable-next-line no-undef
beforeAll(async () => {
  // This will create an new instance of "MongoMemoryServer" and automatically start it
  mongod = await MongoMemoryServer.create();
  // Prepare the env for connectDatabase
  process.env.DATABASE_URL = mongod.getUri();
  console.log("____CONNECTING", process.env.DATABASE_URL)
  await connectDatabase();
  console.log("____CONNECTED")
}, CREATE_DB_TIMEOUT);

// eslint-disable-next-line no-undef
afterEach(async () => {
  // clean up the DB after each test
  await getDb().dropDatabase();
});

// eslint-disable-next-line no-undef
afterAll(async () => {
  await mongod.stop();
});
