import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';

const Submission: OpenAPIV3.SchemaObject = {
  type: 'object',
  // TODO: figure out which fields are required ( at all levels of nesting )
  /* I think the way to answer this question today is to read and/or exercise the code to see
  if not including certain properties breaks things.

  We could also just require as much as possible and see what breaks.
  Obviously we want to test that the surveystack client doesn't break but if there are other api consumers,
  we probably just have to wait to hear if we break them rather than trying to figure it out ahead of time.
  */
  // TODO: apply `additionalProperties: false` in as many places as possible
  required: ['_id', 'data', 'meta'],
  properties: {
    _id: { type: 'string', format: 'objectid' },
    meta: {
      type: 'object',
      required: ['dateCreated', 'dateModified', 'isDraft'],
      properties: {
        isDraft: { type: 'boolean' },
        dateCreated: { type: 'string', format: 'date-time' },
        dateModified: { type: 'string', format: 'date-time' },
        dateSubmitted: { type: 'string', format: 'date-time', nullable: true },
        survey: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'objectid' },
            name: { type: 'string' },
            version: { type: 'number' },
          },
        },
        revision: { type: 'number' },
        // TODO: what is the type of permissions.items? Is this used or legacy?
        permissions: {
          type: 'array',
          items: {},
        },
        status: {
          type: 'array',
          items: {
            type: 'object',
            required: ['type', 'value'],
            properties: {
              type: { type: 'string' },
              value: {
                type: 'object',
                required: ['at'],
                properties: {
                  at: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        group: {
          type: 'object',
          required: ['id', 'path'],
          properties: {
            id: { type: 'string', format: 'objectid' },
            path: { type: 'string' },
          },
        },
        specVersion: { type: 'number' },
        creator: { type: 'string', nullable: true },
      },
    },
    data: {},
  },
};

const DraftSubmission: OpenAPIV3.SchemaObject = {
  ...Submission,
  properties: {
    ...Submission.properties,
    meta: {
      ...Submission.properties?.meta,
      properties: {
        ...(Submission.properties?.meta as OpenAPIV3.SchemaObject)?.properties,
        isDraft: { type: 'boolean', enum: [true] },
      },
    },
  },
};

export { Submission, DraftSubmission };
