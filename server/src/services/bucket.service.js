import AWS from 'aws-sdk';
import dotenv from 'dotenv-defaults';
dotenv.config();

// https://coolaj86.com/articles/upload-to-s3-with-node-the-right-way/
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
var AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
var AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

var s3 = new AWS.S3({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
});

var fs = require('fs');
var path = require('path');

export function uploadToS3(keyPrefix, filePath) {
  // ex: /path/to/my-picture.png becomes my-picture.png
  var fileName = path.basename(filePath);
  var fileStream = fs.createReadStream(filePath);

  // If you want to save to "my-bucket/{prefix}/{filename}"
  //                    ex: "my-bucket/my-pictures-folder/my-picture.png"
  var keyName = path.join(keyPrefix, fileName);

  return new Promise(function(resolve, reject) {
    fileStream.once('error', reject);
    s3.upload({
      Bucket: AWS_BUCKET_NAME,
      Key: keyName,
      Body: fileStream,
    })
      .promise()
      .then(resolve, reject);
  });
}
