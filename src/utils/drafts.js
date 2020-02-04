import * as db from '@/store/db';

export const loadResults = () => new Promise((resolve, reject) => {
  db.openDb(() => {
    db.getAllSubmissions((results) => {
      if (!results || results.length === 0) {
        reject();
      } else {
        resolve(results);
      }
    });
  });
});
