import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';
import { Script } from './Script';

const schemas: { [key: string]: OpenAPIV3.SchemaObject } = {
  Script,
};

export default schemas;
