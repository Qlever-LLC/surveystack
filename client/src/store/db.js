import { openDB } from 'idb';
import { isProxy, toRaw } from 'vue';

const DATABASE_NAME = 'Database';
const stores = {
  SUBMISSIONS: 'submissions',
  PINNEDSURVEYS: 'pinnedSurveys',
  RESOURCES: 'resources',
};

const db = openDB(DATABASE_NAME, 8, {
  upgrade(db, oldVersion) {
    if (oldVersion < 4) {
      db.createObjectStore(stores.SUBMISSIONS, { keyPath: '_id' });
      db.createObjectStore(stores.PINNEDSURVEYS, { keyPath: '_id' });
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
function clearAllPinnedSurveys() {
  return clearObjectStore(stores.PINNEDSURVEYS);
}
function clearAllResources() {
  return clearObjectStore(stores.RESOURCES);
}

async function persist(storeName, obj) {
  return (await db).put(storeName, isProxy(obj) ? toRaw(obj) : obj);
}
function persistSubmission(submission) {
  return persist(stores.SUBMISSIONS, submission);
}
function persistPinnedSurvey(pinnedSurvey) {
  return persist(stores.PINNEDSURVEYS, pinnedSurvey);
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
function getAllPinnedSurveys() {
  return getResults(stores.PINNEDSURVEYS);
}
function getAllResources() {
  return getResults(stores.RESOURCES);
}

async function getSubmission(id) {
  return (await db).get(stores.SUBMISSIONS, id);
}

async function removeFromIndexedDB(storeName, id) {
  return (await db).delete(storeName, id);
}

function deleteSubmission(id) {
  return removeFromIndexedDB(stores.SUBMISSIONS, id);
}
function deletePinnedSurvey(id) {
  return removeFromIndexedDB(stores.PINNEDSURVEYS, id);
}

const migrateSubmissions = async () => {
  const drafts = await getAllSubmissions();

  const isResubmissionDraft = (draft) => draft.meta.dateSubmitted && !draft.meta.isDraft;
  const isProxyDraft = (draft) => draft.meta.submitAsUser;
  const draftsToDelete = drafts.filter((draft) => isResubmissionDraft(draft) || isProxyDraft(draft));
  const remainingDrafts = drafts.filter((draft) => !(isResubmissionDraft(draft) || isProxyDraft(draft)));

  const upgradeSubmissionFromVXtoV4 = (submission) => {
    submission.meta.isDraft = true;
    submission.meta.isDeletedDraft = false;
    submission.meta.specVersion = 4;
    return submission;
  };

  const removals = draftsToDelete.map((draft) => removeFromIndexedDB(stores.SUBMISSIONS, draft._id));
  const updates = remainingDrafts.map(upgradeSubmissionFromVXtoV4).map(persistSubmission);

  return Promise.all([...removals, ...updates]);
};

export {
  stores,
  clearAllSubmissions,
  clearAllPinnedSurveys,
  clearAllResources,
  persistSubmission,
  persistPinnedSurvey,
  persistResource,
  getAllSubmissions,
  getAllPinnedSurveys,
  getAllResources,
  getSubmission,
  removeFromIndexedDB,
  deleteSubmission,
  deletePinnedSurvey,
  migrateSubmissions,
};
