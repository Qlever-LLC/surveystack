import boom from '@hapi/boom';
import { Request, Response } from 'express';
import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';

const syncDrafts = async (req: Request, res: Response) => {
  const submissions = req.body as any[];
  
  const requestingUserDoesNotOwnAllSubmissions = submissions.some(submission => submission.meta.creator !== res.locals.auth.user._id);
  if (requestingUserDoesNotOwnAllSubmissions) {
    throw boom.unauthorized();
  }


  return res.status(200).send();
}

const paths: OpenAPIV3.PathsObject = {
  '/api/submissions/sync-drafts': {
    post: {
      summary: 'Sync draft submissions to the server.',
      requestBody: {
        description: 'A list of draft submissions to sync.',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/DraftSubmission',
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successfully synced drafts to the server.',
        },
        401: {
          $ref: '#/components/responses/401',
        },
      }
    },
  },
};

export {
  syncDrafts,
  paths,
}