import { MongoClient, Db } from "mongodb";

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
};

export { db, connectDatabase };
