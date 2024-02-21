import {
  type MongoClient,
  type ClientSessionOptions,
  type ClientSession,
  type WithSessionCallback,
  type TransactionOptions,
} from 'mongodb';

/**
 * A wrapper around mongodb's MongoClient.withSession that returns the result of the operation instead of discarding it.
 */
async function withSession(
  client: MongoClient,
  operation: WithSessionCallback,
  options?: ClientSessionOptions
) {
  let result;

  if (options) {
    await client.withSession(options, (session) => ((result = operation(session)), result));
  } else {
    await client.withSession((session) => ((result = operation(session)), result));
  }

  return result;
}

/**
 * A wrapper around mongodb's ClientSession.withTransaction that returns the result of the WithTransactionCallback instead of discarding it.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function withTransaction(session: ClientSession, fn: any, options?: TransactionOptions) {
  let result;

  if (options) {
    await session.withTransaction(() => ((result = fn()), result), options);
  } else {
    await session.withTransaction(() => ((result = fn()), result));
  }

  return result;
}

export { withSession, withTransaction };
