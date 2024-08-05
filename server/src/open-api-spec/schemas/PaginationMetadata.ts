import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';

const PaginationMetadata: OpenAPIV3.SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['limit', 'skip', 'total'],
  properties: {
    limit: { type: 'number' },
    skip: { type: 'number' },
    total: { type: 'number' },
  },
};

export { PaginationMetadata };
