const openIdb = () =>
  new Promise((resolve, reject) => {
    const idbOpenRequest = indexedDB.open('Database');
    idbOpenRequest.onerror = (event) => {
      console.error('Failed to open IndexedDB.', event);
      reject(new Error('Failed to open IndexedDB'));
    };
    idbOpenRequest.onsuccess = (event) => {
      resolve(event.target.result);
    };
  });

const getItem = (db, objectStoreName, key) =>
  new Promise((resolve, reject) => {
    const idbGetRequest = db.transaction(objectStoreName).objectStore(objectStoreName).get(key);
    idbGetRequest.onsuccess = () => {
      // resource = idbGetRequest.result;
      console.log(idbGetRequest.result);
      resolve(idbGetRequest.result);
    };
    idbGetRequest.onerror = (ev) => {
      // console.error(ev);
      reject(new Error(`Failed to retrieve ${objectStoreName} ${key}`));
    };
  });

self.addEventListener('fetch', (event) => {
  const {
    request: { url },
  } = event;
  const pattern = /\/resources\/([a-z0-9]+)\/.+$/;
  const matches = url.match(pattern);
  if (matches && matches[1]) {
    event.respondWith(
      (async () => {
        console.log('Fetching resource', matches[1]);
        try {
          console.log('Returning resource from the network');
          return await fetch(event.request);
        } catch {
          const db = await openIdb();
          const resource = await getItem(db, 'resources', matches[1]);
          console.log('Returning resource from IDB', resource);
          return new Response(resource.fileData, { headers: { 'content-type': resource.contentType } });
        }
      })()
    );
  }
});

console.log('sw-resources-listener.js loaded');
