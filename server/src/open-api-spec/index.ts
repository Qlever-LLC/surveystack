import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';
import schemas from './schemas';
import { paths as scriptPaths } from '../controllers/scriptController';

const openApiSpecDocument: OpenAPIV3.Document = {
  openapi: '3.0.1',
  info: {
    title: 'SurveyStack API',
    version: '0.0.1',
    description: 'The SurveyStack API',
  },
  paths: {
    ...scriptPaths,
  },
  components: {
    schemas,
  },
};

export default openApiSpecDocument;
