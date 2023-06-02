let db = null;

const stores = {
  SUBMISSIONS: 'submissions',
  SURVEYS: 'surveys',
  RESOURCES: 'resources',
};

const DATABASE_NAME = 'Database';

// OPEN
function openDb(onSuccess, version = 8) {
  if (db) {
    if (typeof onSuccess === 'function') {
      return onSuccess();
    }

    return;
  }

  const request = indexedDB.open(DATABASE_NAME, version);

  request.onupgradeneeded = (event) => {
    console.log('IDB - Upgrade Needed');

    db = event.target.result;

    try {
      console.log('creating submission store');
      db.createObjectStore(stores.SUBMISSIONS, { keyPath: '_id' });
    } catch (e) {
      console.warn('IDB - Failed to create submission store', e);
    }

    try {
      console.log('creating survey store');
      db.createObjectStore(stores.SURVEYS, { keyPath: '_id' });
    } catch (e) {
      console.warn('IDB - Failed to create survey store', e);
    }

    try {
      console.log('creating resources store');
      db.createObjectStore(stores.RESOURCES, { keyPath: '_id' });
    } catch (e) {
      console.warn('IDB - Failed to create resources store', e);
    }
  };

  request.onsuccess = (event) => {
    console.log('IDB - success');
    db = event.target.result;
    db.close = () => {
      db = null;
    };
    if (typeof onSuccess === 'function') {
      onSuccess();
    }
  };

  request.onerror = () => {
    console.warn('IDB - Failed', request.error);
  };
}

function getObjectStore(storeName, mode) {
  const transaction = db.transaction([storeName], mode);
  return transaction.objectStore(storeName);
}

// INSERT/UPDATE
function persist(storeName, obj) {
  return new Promise((resolve, reject) => {
    openDb(() => {
      const objectStore = getObjectStore(storeName, 'readwrite');
      const request = objectStore.put(obj);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  });
}

function persistSubmission(submission) {
  return persist(stores.SUBMISSIONS, submission);
}

function persistSurvey(survey) {
  return persist(stores.SURVEYS, survey);
}

function persistResource(resource) {
  return persist(stores.RESOURCES, resource);
}

// READ
function get(storeName, id) {
  return new Promise((resolve, reject) => {
    openDb(() => {
      const objectStore = getObjectStore(storeName);
      const request = objectStore.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  });
}

function getAll(storeName) {
  return new Promise((resolve, reject) => {
    openDb(() => {
      const objectStore = getObjectStore(storeName);
      const request = objectStore.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  });
}

function getSubmission(id) {
  return get(stores.SUBMISSIONS, id);
}

function getAllSubmissions() {
  return getAll(stores.SUBMISSIONS);
}

function getSurvey(id) {
  return get(stores.SURVEYS, id);
}

function getAllSurveys() {
  return getAll(stores.SURVEYS);
}

function getResource(id) {
  return get(stores.RESOURCES, id);
}

function getAllResources() {
  return getAll(stores.RESOURCES);
}

// DELETE
function remove(storeName, id) {
  return new Promise((resolve, reject) => {
    openDb(() => {
      const objectStore = getObjectStore(storeName, 'readwrite');
      const request = objectStore.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

function clear(storeName) {
  return new Promise((resolve, reject) => {
    openDb(() => {
      const objectStore = getObjectStore(storeName, 'readwrite');
      const request = objectStore.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

function deleteSubmission(id) {
  return remove(stores.SUBMISSIONS, id);
}

function deleteAllSubmissions() {
  return clear(stores.SUBMISSIONS);
}

function deleteSurvey(id) {
  return remove(stores.SURVEYS, id);
}

function deleteAllSurveys() {
  return clear(stores.SURVEYS);
}

function deleteResource(id) {
  return remove(stores.RESOURCES, id);
}

function deleteAllResources() {
  return clear(stores.RESOURCES);
}

export {
  openDb,
  persistSubmission,
  persistSurvey,
  persistResource,
  getSubmission,
  getAllSubmissions,
  getSurvey,
  getAllSurveys,
  getResource,
  getAllResources,
  deleteSubmission,
  deleteAllSubmissions,
  deleteSurvey,
  deleteAllSurveys,
  deleteResource,
  deleteAllResources,
};
