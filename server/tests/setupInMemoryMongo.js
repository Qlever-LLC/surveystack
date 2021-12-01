const { MongoMemoryServer } = require('mongodb-memory-server');
const { connectDatabase, getDb } = require('../src/db');

beforeAll(async () => {
  // This will create an new instance of "MongoMemoryServer" and automatically start it
  const mongod = await MongoMemoryServer.create();
  // Prepare the env for connectDatabase
  process.env.DATABASE_URL = mongod.getUri();
  await connectDatabase();
});

afterEach(() => {
  // clean up the DB after each test
  getDb().dropDatabase();
});
