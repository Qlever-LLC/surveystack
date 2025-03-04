import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDatabase, getDb, disconnect } from '../src/db/index.js';

let mongod: MongoMemoryServer;

const CREATE_DB_TIMEOUT = 60000;
// eslint-disable-next-line no-undef
beforeAll(async () => {
  // This will create an new instance of "MongoMemoryServer" and automatically start it
  mongod = await MongoMemoryServer.create({
    binary: { version: '6.0.4' },
  });

  // Prepare the env for connectDatabase
  process.env.DATABASE_URL = mongod.getUri();
  await connectDatabase();
}, CREATE_DB_TIMEOUT);

// eslint-disable-next-line no-undef
afterEach(async () => {
  // clean up the DB after each test
  await getDb().dropDatabase();
  // recreate indices
  process.env.DATABASE_URL = mongod.getUri();
  await connectDatabase();
});

// eslint-disable-next-line no-undef
afterAll(async () => {
  await disconnect();
  await mongod.stop();
});
