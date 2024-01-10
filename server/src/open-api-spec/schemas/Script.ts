import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';

const Script: OpenAPIV3.SchemaObject = {
  type: 'object',
  required: ['_id', 'name', 'content', 'meta'],
  properties: {
    _id: { type: 'string', format: 'objectid' },
    name: { type: 'string' },
    content: { type: 'string' },
    meta: {
      type: 'object',
      required: ['creator', 'dateCreated', 'dateModified', 'group', 'revision', 'specVersion'],
      properties: {
        creator: { type: 'string', format: 'objectid', nullable: true },
        dateCreated: { type: 'string', format: 'date-time' },
        dateModified: { type: 'string', format: 'date-time' },
        group: {
          type: 'object',
          required: ['id', 'path'],
          properties: {
            id: { type: 'string', format: 'objectid' },
            path: { type: 'string' },
          },
        },
        revision: { type: 'number' },
        specVersion: { type: 'number' },
      },
    },
  },
};

export { Script };
