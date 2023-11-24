import dotenv from 'dotenv-defaults';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

dotenv.config();

const AWS_S3_REGION = process.env.AWS_S3_REGION;
const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
const AWS_S3_ACCESS_KEY_ID = process.env.AWS_S3_ACCESS_KEY_ID;
const AWS_S3_SECRET_ACCESS_KEY = process.env.AWS_S3_SECRET_ACCESS_KEY;
const AWS_S3_ENDPOINT_OVERRIDE = process.env.AWS_S3_ENDPOINT_OVERRIDE;

const s3Client = getS3Client();

function getS3Client() {
  if (AWS_S3_ENDPOINT_OVERRIDE) {
    // S3-compatible service like min.io or localstack
    return new S3Client({
      credentials: {
        accessKeyId: AWS_S3_ACCESS_KEY_ID,
        secretAccessKey: AWS_S3_SECRET_ACCESS_KEY,
      },
      region: AWS_S3_REGION,
      endpoint: AWS_S3_ENDPOINT_OVERRIDE,
      sslEnabled: false,
      forcePathStyle: true,
    });
  } else {
    // access the official AWS S3 instance, located by S3Client library
    return new S3Client({
      credentials: {
        accessKeyId: AWS_S3_ACCESS_KEY_ID,
        secretAccessKey: AWS_S3_SECRET_ACCESS_KEY,
      },
      region: AWS_S3_REGION,
    });
  }
}

export async function getUploadUrl(key, contentType, contentLength) {
  const command = new PutObjectCommand({
    Bucket: AWS_S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
  });
  return await getSignedUrl(s3Client, command, {
    expiresIn: 3600, //in seconds, eq 1 hour
  });
}

export async function getSignedDownloadUrl(key) {
  const command = new GetObjectCommand({ Bucket: AWS_S3_BUCKET_NAME, Key: key });
  return await getSignedUrl(s3Client, command, {
    expiresIn: 3600, //in seconds, eq 1 hour
  });
}

export function getPublicDownloadUrl(resourceKey) {
  // TODO: update to use environment variable instead of '.s3.amazonaws.com/' to support local development
  return 'https://' + AWS_S3_BUCKET_NAME + '.s3.amazonaws.com/' + resourceKey;
}

export async function deleteObject(key) {
  return await s3Client.send(new DeleteObjectCommand({ Bucket: AWS_S3_BUCKET_NAME, Key: key }));
}

export default {
  AWS_S3_ENDPOINT_OVERRIDE,
  AWS_S3_BUCKET_NAME,
  getUploadUrl,
  getSignedDownloadUrl,
  getPublicDownloadUrl,
  deleteObject,
};
