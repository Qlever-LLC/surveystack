import bucketService from './bucket.service';
import axios from "axios";
import uuidv4 from 'uuid/v4';
import { Blob } from 'buffer';

const fileContent = 'test data content 2';

function getMockFile() {
  let content = fileContent;
  let contentType = 'text/plain';
 // let fileLength = Buffer.from(content).length;
  let fileName = 'resources/surveys/'+uuidv4()+'test_file.txt';

  let blob = new Blob([content], { type: contentType});
  blob["lastModifiedDate"] = "";
  blob["name"] = fileName;
  //blob["size"] = fileLength;
  return blob;
}

describe.skip('Bucket service', () => {
  describe('getUploadUrl', () => {
    const file = getMockFile();
    let signedUploadUrl;
    it('returns an URL to the testing endpoint', async() => {
      signedUploadUrl = await bucketService.getUploadUrl(file.name, file.type, file.size);
      expect(signedUploadUrl).toContain(bucketService.AWS_S3_BUCKET_NAME);
      expect(signedUploadUrl).toContain(file.name);
    });
    it('allow to upload a file with the requested and signed size', async() => {
      const response = await axios.put(signedUploadUrl, fileContent, { validateStatus: false });
      expect(response.status).toBe(200);
      let responseDelete = await bucketService.deleteObject(file.name);
      expect(responseDelete.$metadata.httpStatusCode).toBe(204);
    });
    it('prevents to upload a file with a size bigger than the requested and signed size', async() => {
      const response = await axios.put(signedUploadUrl, fileContent+'additional_data', { validateStatus: false });
      expect(response.status).toBe(403);
    });
  });

  describe('getDownloadURL', () => {
    const file = getMockFile();
    let signedDownloadUrl;
    it('returns an URL to the testing endpoint', async () => {
      signedDownloadUrl= await bucketService.getDownloadUrl(file.name);
      expect(signedDownloadUrl).toContain(bucketService.AWS_S3_BUCKET_NAME);
      expect(signedDownloadUrl).toContain(file.name);
    });
    it('responds with Not Found if object is not available', async() => {
      let url = await bucketService.getDownloadUrl("non-existing-file.txt");
      const response = await axios.get(url, { validateStatus: false });
      expect(response.statusText).toBe('Not Found');
    });
    it('returns existing file', async() => {
      let signedUrl = await bucketService.getUploadUrl(file.name, file.type, file.size);
      const responseUpload = await axios.put(signedUrl, fileContent, { validateStatus: false });
      expect(responseUpload.status).toBe(200);
      let url = await bucketService.getDownloadUrl(file.name);
      const response = await axios.get(url, { validateStatus: false });
      expect(response.status).toBe(200);
      let responseDelete = await bucketService.deleteObject(file.name);
      expect(responseDelete.$metadata.httpStatusCode).toBe(204);
    });
  });

  describe('deleteObject', () => {
    const file = getMockFile();
    it('deletes an existing object, and thats not avilable anymore afterwards', async() => {
      let signedUrl = await bucketService.getUploadUrl(file.name, file.type, file.size);
      const responseUpload = await axios.put(signedUrl, fileContent, { validateStatus: false });
      expect(responseUpload.status).toBe(200);
      let responseDelete = await bucketService.deleteObject(file.name);
      expect(responseDelete.$metadata.httpStatusCode).toBe(204);
      let url = await bucketService.getDownloadUrl(file.name);
      const response = await axios.get(url, { validateStatus: false });
      expect(response.status).toBe(404);
    });
  });
});
