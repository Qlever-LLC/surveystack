import assert from 'assert';
import boom from '@hapi/boom';
import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types';
import { Request, Response } from 'express';
import rolesService from '../services/roles.service';

import { MongoError, ObjectId } from 'mongodb';

import { db } from '../db';

const col = 'scripts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sanitize = async (entity: any) => {
  if (entity._id) {
    entity._id = new ObjectId(entity._id);
  }

  if (entity.meta) {
    if (entity.meta.dateCreated) {
      entity.meta.dateCreated = new Date(entity.meta.dateCreated);
    }

    if (entity.meta.dateModified) {
      entity.meta.dateModified = new Date(entity.meta.dateModified);
    }

    if (entity.meta.creator) {
      entity.meta.creator = new ObjectId(entity.meta.creator);
    }

    if (entity.meta.group) {
      if (entity.meta.group.id) {
        const _id = new ObjectId(entity.meta.group.id);
        entity.meta.group.id = _id;
        const group = await db.collection('groups').findOne({ _id });
        if (group) {
          entity.meta.group.path = group.path;
        }
      }
    }
  }
};

const getScripts = async (req: Request, res: Response) => {
  const { q, groupId } = req.query;
  const filter: {
    _id?: ObjectId;
    name?: { $regex: string; $options: string };
    'meta.group.id'?: ObjectId;
  } = {};
  const projection = { content: 0 };

  if (typeof q === 'string') {
    if (ObjectId.isValid(q)) {
      filter._id = new ObjectId(q);
    } else {
      filter.name = { $regex: q, $options: 'i' };
    }
  }

  if (typeof groupId === 'string' && ObjectId.isValid(groupId)) {
    filter['meta.group.id'] = new ObjectId(groupId);
  }

  const entities = await db
    .collection(col)
    .find(filter)
    .project(projection)
    .sort({ name: 1 })
    .toArray();
  return res.send(entities);
};

const getScript = async (req: Request, res: Response) => {
  const { id } = req.params;

  console.log('getScript', id);
  const entity = await db.collection(col).findOne({ _id: new ObjectId(id) });

  if (!entity) {
    throw boom.notFound();
  }

  return res.send(entity);
};

const createScript = async (req: Request, res: Response) => {
  const entity = req.body;
  sanitize(entity);
  entity.meta.creator = res.locals.auth.user._id;

  const hasAdminRoleForGroup = await rolesService.hasAdminRoleForRequest(res, entity.meta.group.id);

  if (!hasAdminRoleForGroup) {
    return res.status(401).send();
  }

  try {
    const insertResult = await db.collection(col).insertOne(entity);
    assert.equal(insertResult?.acknowledged, true);
    return res.status(201).json({ _id: insertResult.insertedId, ...entity });
  } catch (err) {
    if (err instanceof MongoError && err.code === 11000) {
      throw boom.conflict(`Entity with _id already exists: ${entity._id}`);
    }
  }

  throw boom.internal();
};

const updateScript = async (req: Request, res: Response) => {
  const { id } = req.params;
  const entity = req.body;

  const hasAdminRoleForExistingGroup = await rolesService.hasAdminRoleForRequest(
    res,
    res.locals.existing.meta.group?.id
  );

  if (!hasAdminRoleForExistingGroup) {
    return res.status(401).send();
  }

  const isUpdatingGroup = entity.meta.group?.id !== res.locals.existing.meta.group?.id;
  if (isUpdatingGroup) {
    const hasAdminRoleForNewGroup = await rolesService.hasAdminRoleForRequest(
      res,
      entity.meta.group?.id
    );

    if (!hasAdminRoleForNewGroup) {
      return res.status(401).send();
    }
  }

  sanitize(entity);
  entity.meta.dateModified = new Date();

  try {
    const updated = await db.collection(col).findOneAndUpdate(
      { _id: new ObjectId(id) },
      // TODO: only set updatable properties instead of replacing entire entity
      { $set: entity },
      {
        returnDocument: 'after',
      }
    );
    return res.send(updated);
  } catch (err) {
    return res.status(500).send();
  }
};

const deleteScript = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const deleteResult = await db.collection(col).deleteOne({ _id: new ObjectId(id) });
    assert.equal(1, deleteResult.deletedCount);
    return res.send({ message: 'OK' });
  } catch (error) {
    return res.status(500).send();
  }
};

const paths: OpenAPIV3.PathsObject = {
  '/api/scripts': {
    post: {
      summary: 'Creates a script.',
      requestBody: {
        description: 'The script to create.',
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Script',
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Successfully created the script.',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Script',
              },
            },
          },
        },
      },
    },
  },
};

export { getScripts, getScript, createScript, updateScript, deleteScript, paths };
