const surveys = [];

const invites = [];

const dashboards = [];

const submissions = [];

const users = [];

const scripts = [];

const groups = [];

let db = null;

const stores = {
  SUBMISSIONS: 'submissions',
  SURVEYS: 'surveys',
  RESOURCES: 'resources',
};

const DATABASE_NAME = 'Database';

// Opening a Database
function openDb(onSuccess) {
  const request = indexedDB.open(DATABASE_NAME, 8);
  db = null;

  request.onerror = (event) => {
    console.log(`Error: ${event}`);
  };

  request.onsuccess = (event) => {
    console.log('IDB Success', event);
    db = event.target.result;
    if (onSuccess) {
      onSuccess();
    }
  };

  // OnUpgradeNeeded Handler
  request.onupgradeneeded = (event) => {
    console.log('On Upgrade Needed');

    db = event.target.result;
    // eslint-disable-next-line no-unused-vars
    try {
      console.log('creating submission store');
      db.createObjectStore(stores.SUBMISSIONS, { keyPath: '_id' });
    } catch (error) {
      // ignore
    }

    try {
      console.log('creating survey store');
      db.createObjectStore(stores.SURVEYS, { keyPath: '_id' });
    } catch (error) {
      // ignore
    }

    try {
      console.log('creating resources store');
      db.createObjectStore(stores.RESOURCES, { keyPath: '_id' });
    } catch (error) {
      // ignore
    }
  };
}

function getObjectStore(storeName, mode) {
  const tx = db.transaction(storeName, mode);
  return tx.objectStore(storeName);
}

function clearObjectStore(storeName) {
  try {
    // Get the ObjectStore
    const store = getObjectStore(storeName, 'readwrite');
    // Clear the ObjectStore
    const req = store.clear();
    // Success Handler
    req.onsuccess = (event) => {
      console.log(`clear successful: ${event}`);
    };
    // Error Handler
    req.onerror = (event) => {
      console.log(`clear failed: ${event}`);
    };
  } catch (err) {
    console.log(err);
  }
}

function clearAllSubmissions() {
  clearObjectStore(stores.SUBMISSIONS);
}

function clearAllSurveys() {
  clearObjectStore(stores.SURVEYS);
}

function clearAllResources() {
  clearObjectStore(stores.RESOURCES);
}

function persist(storeName, obj) {
  try {
    const store = getObjectStore(storeName, 'readwrite');
    let req;

    req = store.put(obj);

    req.onsuccess = (evt) => {
      console.log(`Insertion in DB successful: ${evt}`);
    };
    req.onerror = () => {
      console.log('Insertion in DB Failed ', this.error);
    };
  } catch (err) {
    console.warn('unable to persist to IDB', err);
  }
}

function persistSubmission(submission) {
  persist(stores.SUBMISSIONS, submission);
}

function persistSurvey(survey) {
  persist(stores.SURVEYS, survey);
}

function persistResource(resource) {
  persist(stores.RESOURCES, resource);
}

function getResults(storeName, success) {
  // Create an array
  const results = [];
  // Get the ObjectStore
  const objectStore = getObjectStore(storeName, 'readwrite');

  // Open the Cursor on the ObjectStore
  objectStore.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    // If there is a next item, add it to the array
    if (cursor) {
      results.push(cursor.value);
      // console.log(cursor.value);
      cursor.continue();
    } else {
      success(results);
    }
  };

  objectStore.openCursor().onerror = (event) => {
    console.log(`Error: ${event}`);
  };
}

// Read All data in ObjectStore
function getAllSubmissions(onSuccess) {
  getResults(stores.SUBMISSIONS, onSuccess);
}

function getAllSurveys(onSuccess) {
  getResults(stores.SURVEYS, onSuccess);
}

function getAllResources(onSuccess) {
  getResults(stores.RESOURCES, onSuccess);
}

function saveToIndexedDB(storeName, object) {
  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open(DATABASE_NAME);

    if (object._id === undefined) reject(Error('object has no _id.'));

    dbRequest.onerror = (ev) => {
      reject(Error('IndexedDB database error'));
    };

    dbRequest.onupgradeneeded = (ev) => {
      const database = ev.target.result;
      const objectStore = database.createObjectStore(storeName, { keyPath: '_id' });
    };

    dbRequest.onsuccess = (event) => {
      const database = event.target.result;
      const transaction = database.transaction(storeName, 'readwrite');
      const objectStore = transaction.objectStore(storeName);
      const objectRequest = objectStore.put(object); // Overwrite if exists

      objectRequest.onerror = (ev) => {
        reject(Error('Error text'));
      };

      objectRequest.onsuccess = (ev) => {
        resolve('Data saved OK');
      };
    };
  });
}

function removeFromIndexedDB(storeName, id) {
  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open(DATABASE_NAME);

    dbRequest.onerror = (ev) => {
      reject(Error('IndexedDB database error'));
    };

    dbRequest.onupgradeneeded = (ev) => {
      const database = ev.target.result;
      database.createObjectStore(storeName, { keyPath: '_id' });
    };

    dbRequest.onsuccess = (event) => {
      const database = event.target.result;
      const transaction = database.transaction(storeName, 'readwrite');
      const objectStore = transaction.objectStore(storeName);
      const objectRequest = objectStore.delete(id);

      objectRequest.onerror = (ev) => {
        reject(Error(`Error deleting ID ${id} from ${storeName}`));
      };

      objectRequest.onsuccess = (ev) => {
        resolve(`Success deleting ID ${id} from ${storeName}`);
      };
    };
  });
}

const migrateSubmissions = async () => {
  const drafts = await new Promise((resolve) => {
    openDb(() => {
      getAllSubmissions((results) => resolve(results));
    });
  });

  const isResubmissionDraft = (draft) => draft.meta.dateSubmitted && !draft.meta.isDraft;
  const resubmissionDrafts = drafts.filter(isResubmissionDraft);
  const remainingDrafts = drafts.filter((draft) => !isResubmissionDraft(draft));

  await Promise.all(resubmissionDrafts.map((draft) => removeFromIndexedDB(stores.SUBMISSIONS, draft._id)));

  const upgradeSubmissionFromVXtoV4 = (submission) => {
    submission.meta.isDraft = true;
    submission.meta.isDeletedDraft = false;
    submission.meta.specVersion = 4;
    return submission;
  };

  remainingDrafts.map(upgradeSubmissionFromVXtoV4).forEach(persistSubmission);
};
migrateSubmissions();

export {
  surveys,
  submissions,
  invites,
  dashboards,
  users,
  groups,
  scripts,
  openDb,
  persistSubmission,
  persistResource,
  persistSurvey,
  getAllSubmissions,
  clearAllSubmissions,
  getAllSurveys,
  clearAllSurveys,
  getAllResources,
  clearAllResources,
  saveToIndexedDB,
  stores,
  removeFromIndexedDB,
};
