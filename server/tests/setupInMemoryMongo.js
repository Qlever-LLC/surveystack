const { MongoMemoryServer } = require('mongodb-memory-server');
const { connectDatabase, getDb } = require('../src/db');

let mongod;

const CREATE_DB_TIMEOUT = 60000;
beforeAll(async () => {
  // This will create an new instance of "MongoMemoryServer" and automatically start it
  mongod = await MongoMemoryServer.create();
  // Prepare the env for connectDatabase
  process.env.DATABASE_URL = mongod.getUri();
  await connectDatabase();
}, CREATE_DB_TIMEOUT);

afterEach(async () => {
  // clean up the DB after each test
  await getDb().dropDatabase();
});

afterAll(async () => {
  await mongod.stop();
})
