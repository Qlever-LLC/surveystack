// file-upload.service.js

import api from '@/services/api.service';

function upload(url, formData) {
  return (
    api
      .post(url, formData)
      // get data
      .then((x) => x.data)
  );
}

export { upload };
