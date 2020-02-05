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
};

// Opening a Database
function openDb(onSuccess) {
  const request = indexedDB.open('Database', 7);
  db = this.result;

  request.onerror = (event) => {
    console.log(`Error: ${event}`);
  };

  request.onsuccess = (event) => {
    console.log(`Success: ${event}`);
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
      db.createObjectStore(stores.SUBMISSIONS, { keyPath: '_id' });
    } catch (error) {
      // ignore
    }

    try {
      db.createObjectStore(stores.SURVEYS, { keyPath: '_id' });
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
}

function clearAllSubmissions() {
  clearObjectStore(stores.SUBMISSIONS);
}

function clearAllSurveys() {
  clearObjectStore(stores.SURVEYS);
}


function persist(storeName, obj) {
  const store = getObjectStore(storeName, 'readwrite');
  let req;

  try {
    req = store.put(obj);
  } catch (e) {
    throw e;
  }

  req.onsuccess = (evt) => {
    console.log(`Insertion in DB successful: ${evt}`);
  };
  req.onerror = () => {
    console.log('Insertion in DB Failed ', this.error);
  };
}

function persistSubmission(submission) {
  persist(stores.SUBMISSIONS, submission);
}

function persistSurvey(survey) {
  persist(stores.SURVEYS, survey);
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
      console.log(cursor.value);
      cursor.continue();
    } else {
      success(results);
    }
  };
}

// Read All data in ObjectStore
function getAllSubmissions(onSuccess) {
  getResults(stores.SUBMISSIONS, onSuccess);
}


function getAllSurveys(onSuccess) {
  getResults(stores.SURVEYS, onSuccess);
}

/*
  https://stackoverflow.com/questions/41586400/using-indexeddb-asynchronously
  Maybe we could use "idb" which is a wrapper for IndexedDB but with promises?
  Also, we may want to add a "db" module to the Vuex store?
*/
function loadFromIndexedDB(storeName, id) {
  return new Promise(
    ((resolve, reject) => {
      const dbRequest = indexedDB.open(storeName);

      dbRequest.onerror = (ev) => {
        reject(Error('Error text'));
      };

      dbRequest.onupgradeneeded = (ev) => {
        // Objectstore does not exist. Nothing to load
        ev.target.transaction.abort();
        reject(Error('Not found'));
      };

      dbRequest.onsuccess = (ev) => {
        const database = ev.target.result;
        const transaction = database.transaction([storeName]);
        const objectStore = transaction.objectStore(storeName);
        const objectRequest = objectStore.get(id);

        objectRequest.onerror = () => {
          reject(Error('Error text'));
        };

        objectRequest.onsuccess = () => {
          if (objectRequest.result) resolve(objectRequest.result);
          else reject(Error('object not found'));
        };
      };
    }),
  );
}

function saveToIndexedDB(storeName, object) {
  return new Promise(
    ((resolve, reject) => {
      const dbRequest = indexedDB.open(storeName);

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
    }),
  );
}

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
  persistSurvey,
  getAllSubmissions,
  clearAllSubmissions,
  getAllSurveys,
  clearAllSurveys,
  loadFromIndexedDB,
  saveToIndexedDB,
  stores,
};
