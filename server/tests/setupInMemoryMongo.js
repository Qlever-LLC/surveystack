const { MongoMemoryServer } = require('mongodb-memory-server');
const { connectDatabase, getDb } = require('../src/db');

let mongod;

beforeAll(async () => {
  // This will create an new instance of "MongoMemoryServer" and automatically start it
  mongod = await MongoMemoryServer.create();
  // Prepare the env for connectDatabase
  process.env.DATABASE_URL = mongod.getUri();
  await connectDatabase();
});

afterEach(async () => {
  // clean up the DB after each test
  await getDb().dropDatabase();
});

afterAll(async () => {
  await mongod.stop();
})
