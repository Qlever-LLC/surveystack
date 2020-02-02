const surveys = [];

const invites = [];

const dashboards = [];

const submissions = [];

const users = [];

const scripts = [];

const groups = [];


let db = null;

const submissionsStoreName = 'submissions';
const surveyStoreName = 'surveys';

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
      db.createObjectStore(submissionsStoreName, { keyPath: '_id' });
    } catch (error) {
      // ignore
    }

    try {
      db.createObjectStore(surveyStoreName, { keyPath: '_id' });
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

function clearAllSurveyResults() {
  clearObjectStore(submissionsStoreName);
}

function clearAllSurveys() {
  clearObjectStore(surveyStoreName);
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

function persistSurveyResult(surveyResult) {
  persist(submissionsStoreName, surveyResult);
}

function persistSurvey(survey) {
  persist(surveyStoreName, survey);
}

function getResults(storeName, success) {
  // Create an array
  const surveyResults = [];
  // Get the ObjectStore
  const objectStore = getObjectStore(storeName, 'readwrite');

  // Open the Cursor on the ObjectStore
  objectStore.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    // If there is a next item, add it to the array
    if (cursor) {
      surveyResults.push(cursor.value);
      console.log(cursor.value);
      cursor.continue();
    } else {
      success(surveyResults);
    }
  };
}

// Read All data in ObjectStore
function getAllSurveyResults(onSuccess) {
  getResults(submissionsStoreName, onSuccess);
}


function getAllSurveys(onSuccess) {
  getResults(surveyStoreName, onSuccess);
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
  persistSurveyResult,
  persistSurvey,
  getAllSurveyResults,
  clearAllSurveyResults,
  getAllSurveys,
  clearAllSurveys,
};
