/**
 * A wrapper around mongodb's MongoClient.withSession that returns the result of the operation instead of discarding it.
 * @param {MongoClient} client
 * @param {function} operation
 * @param {object} options
 */
async function withSession(client, operation, options) {
  let result;

  if (options) {
    await client.withSession(
      options,
      session => (result = operation(session), result),
    );
  } else {
    await client.withSession(session => (result = operation(session), result));
  }

  return result;
};

/**
 * A wrapper around mongodb's ClientSession.withTransaction that returns the result of the WithTransactionCallback instead of discarding it.
 * @param {ClientSession} session
 * @param {WithTransactionCallback} fn
 * @param {TransactionOptions} options
 */
async function withTransaction(session, fn, options) {
  let result;

  if (options) {
    await session.withTransaction(
      () => (result = fn(), result),
      options,
    );
  } else {
    await session.withTransaction(() => (result = fn(), result));
  }

  return result;
};

export { withSession, withTransaction };
