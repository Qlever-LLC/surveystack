import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';
import { Script } from './Script';
import { Submission, DraftSubmission } from './Submission';

const schemas: { [key: string]: OpenAPIV3.SchemaObject } = {
  Script,
  Submission,
  DraftSubmission,
};

export default schemas;
