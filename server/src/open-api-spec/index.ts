import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';
import schemas from './schemas';
import { paths as scriptPaths } from '../controllers/scriptController';
import { paths as submissionPaths } from '../controllers/submissionController.part';

const openApiSpecDocument: OpenAPIV3.Document = {
  openapi: '3.0.1',
  info: {
    title: 'SurveyStack API',
    version: '0.0.1',
    description: 'The SurveyStack API',
  },
  paths: {
    ...scriptPaths,
    ...submissionPaths,
  },
  components: {
    schemas,
    responses: {
      401: {
        description: 'Unauthorized',
        content: { 'application/json': { schema: { type: 'object' } } },
      },
    },
  },
};

export default openApiSpecDocument;
