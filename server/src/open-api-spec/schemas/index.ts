import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';
import { Script } from './Script';
import { Submission, DraftSubmission } from './Submission';
import { PaginationMetadata } from './PaginationMetadata';

const schemas: { [key: string]: OpenAPIV3.SchemaObject } = {
  Script,
  Submission,
  DraftSubmission,
  PaginationMetadata,
};

export default schemas;
