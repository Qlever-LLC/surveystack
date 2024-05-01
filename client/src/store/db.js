import { openDB } from 'idb';

const DATABASE_NAME = 'Database';
const stores = {
  SUBMISSIONS: 'submissions',
  SURVEYS: 'surveys',
  RESOURCES: 'resources',
};

const db = openDB(DATABASE_NAME, 8, {
  upgrade(db, oldVersion) {
    if (oldVersion < 4) {
      db.createObjectStore(stores.SUBMISSIONS, { keyPath: '_id' });
      db.createObjectStore(stores.SURVEYS, { keyPath: '_id' });
    }
    if (oldVersion < 8) {
      db.createObjectStore(stores.RESOURCES, { keyPath: '_id' });
    }
  },
  blocked(currentVersion, blockedVersion) {
    console.warn(
      `IDB: There are older versions of the database open on the origin, so this version cannot open. Current Ver: ${currentVersion}, Blocked Ver: ${blockedVersion}`
    );
  },
  blocking(currentVersion, blockedVersion) {
    console.warn(
      `IDB: This connection is blocking a future version of the database from opening in another connection. Current Ver: ${currentVersion}, Blocked Ver: ${blockedVersion}. Closing the connection and refreshing the page so that the other connection can proceed.`
    );
    db.close();
    location.reload();
  },
});

async function clearObjectStore(storeName) {
  return (await db).clear(storeName);
}
function clearAllSubmissions() {
  return clearObjectStore(stores.SUBMISSIONS);
}
function clearAllSurveys() {
  return clearObjectStore(stores.SURVEYS);
}
function clearAllResources() {
  return clearObjectStore(stores.RESOURCES);
}

async function persist(storeName, obj) {
  return (await db).put(storeName, obj);
}
function persistSubmission(submission) {
  return persist(stores.SUBMISSIONS, submission);
}
function persistResource(resource) {
  return persist(stores.RESOURCES, resource);
}

async function getResults(storeName) {
  return (await db).getAll(storeName);
}
function getAllSubmissions() {
  return getResults(stores.SUBMISSIONS);
}
function getAllResources() {
  return getResults(stores.RESOURCES);
}

async function removeFromIndexedDB(storeName, id) {
  return (await db).delete(storeName, id);
}

export {
  stores,
  clearAllSubmissions,
  clearAllSurveys,
  clearAllResources,
  persistSubmission,
  persistResource,
  getAllSubmissions,
  getAllResources,
  removeFromIndexedDB,
};
