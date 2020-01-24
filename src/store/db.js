const surveys = [];

const invites = [];

const dashboards = [];

const submissions = [];

const users = [];

const scripts = [];

const groups = [];


let db = null;

const surveysResultsStoreName = 'surveyResults';
// Opening a Database
function openDb(onSuccess) {
  const request = indexedDB.open('Database', 4);
  db = this.result;

  request.onerror = (event) => {
    console.log(`Error: ${event}`);
  };

  request.onsuccess = (event) => {
    console.log(`Success: ${event}`);
    db = event.target.result;
    onSuccess();
  };

  // OnUpgradeNeeded Handler
  request.onupgradeneeded = (event) => {
    console.log('On Upgrade Needed');

    db = event.target.result;
    // eslint-disable-next-line no-unused-vars
    const objectStore = db.createObjectStore(surveysResultsStoreName, { keyPath: '_id' });
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
  clearObjectStore(surveysResultsStoreName);
}

function persistSurveyResult(surveyResult) {
  const store = getObjectStore(surveysResultsStoreName, 'readwrite');
  let req;

  try {
    req = store.put(surveyResult);
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

// Read All data in ObjectStore
function getAllSurveyResults(onSuccess) {
  // Create an array
  const surveyResults = [];
  // Get the ObjectStore
  const objectStore = getObjectStore(surveysResultsStoreName, 'readwrite');

  // Open the Cursor on the ObjectStore
  objectStore.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    // If there is a next item, add it to the array
    if (cursor) {
      surveyResults.push(cursor.value);
      console.log(cursor.value);
      cursor.continue();
    } else {
      onSuccess(surveyResults);
    }
  };
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
  getAllSurveyResults,
  clearAllSurveyResults,
};
