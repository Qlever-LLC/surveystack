import { COLL_GROUPS_HYLO_MAPPINGS, db } from '../db';
import { ObjectId } from 'mongodb';
import Joi from 'joi';
import joiObjectId from 'joi-objectid';
Joi.objectId = joiObjectId(Joi);

import _ from 'lodash';
import boom from '@hapi/boom';

import { gqlRequest } from '../services/hylo/utils';
import { gql } from 'graphql-request';
import { createHyloGroup, upsertHyloUser } from '../services/hylo.service';

const validateOrThrow = (schema, _value) => {
  const { value, error } = schema.validate(_value);
  if (error) {
    const errors = error.details.map((e) => `${e.path.join('.')}: ${e.message}`);
    throw boom.badData(`error: ${errors.join(',')}`);
  }
  return value;
};

export const GROUP_FIELDS = gql`
  fragment GroupFields on Group {
    id
    name
    slug
    # invitePath
    type
    avatarUrl
    bannerUrl
    location
    members {
      items {
        id
        avatarUrl
        bannerUrl
        hasRegistered
        tagline
        url
        contactEmail
      }
    }
  }
`;

export const QUERY_GROUP = gql`
  ${GROUP_FIELDS}
  query Group($id: ID!) {
    group(id: $id) {
      ...GroupFields
    }
  }
`;

const loadHyloGroup = async (id) => {
  const data = await gqlRequest(QUERY_GROUP, { id });
  return data?.group;
};

export const getIntegratedHyloGroup = async (req, res) => {
  const schema = Joi.object({
    groupId: Joi.string()
      .required()
      .messages({ 'any.required': 'The groupId query parameter is required' }),
  });

  const { groupId } = validateOrThrow(schema, req.params);
  const mapping = await db
    .collection(COLL_GROUPS_HYLO_MAPPINGS)
    .findOne({ groupId: new ObjectId(groupId) });
  if (!mapping) {
    return res.json(null);
  }
  const hyloGroup = await loadHyloGroup(mapping.hyloGroupId);
  res.json(hyloGroup);
};

export const createNewIntegratedHyloGroup = async (req, res) => {
  const schema = Joi.object({
    groupId: Joi.string().required(),
  });

  const { groupId } = validateOrThrow(schema, req.body);

  const group = await db.collection('groups').findOne({ _id: new ObjectId(groupId) });
  if (!group) {
    throw boom.notFound(`Can't find SurveyStack group with the ID "${groupId}`);
  }

  const user = res.locals.auth.user;
  const hyloUser = await upsertHyloUser({ name: user.name, email: user.email });
  const { group: hyloGroup } = await createHyloGroup({
    data: {
      accessibility: 1,
      name: group.name,
      slug: group.slug,
      parentIds: [],
      visibility: 1,
    },
    hyloUserId: hyloUser.id,
  });

  await db
    .collection(COLL_GROUPS_HYLO_MAPPINGS)
    .updateOne(
      { groupId: new ObjectId(groupId) },
      { $set: { hyloGroupId: hyloGroup.id } },
      { upsert: true }
    );
  const detailedHyloGroup = await loadHyloGroup(hyloGroup.id);
  res.json(detailedHyloGroup);
};

export const setIntegratedHyloGroup = async (req, res) => {
  const schema = Joi.object({
    hyloGroupId: Joi.string().required(),
    groupId: Joi.string().required(),
  });

  const { hyloGroupId, groupId } = validateOrThrow(schema, req.body);

  const hyloGroup = await loadHyloGroup(hyloGroupId);
  if (!hyloGroup) {
    throw boom.notFound(`Can't find Hylo group with the ID "${hyloGroupId}`);
  }

  const group = await db.collection('groups').findOne({ _id: new ObjectId(groupId) });
  if (!group) {
    throw boom.notFound(`Can't find SurveyStack group with the ID "${groupId}"`);
  }

  await db
    .collection(COLL_GROUPS_HYLO_MAPPINGS)
    .updateOne({ groupId: ObjectId(groupId) }, { $set: { hyloGroupId } }, { upsert: true });

  res.json(hyloGroup);
};
export const removeHyloGroupIntegration = async (req, res) => {
  const schema = Joi.object({
    groupId: Joi.string().required(),
  });

  const { groupId } = validateOrThrow(schema, req.body);

  await db.collection(COLL_GROUPS_HYLO_MAPPINGS).deleteOne({ groupId: new ObjectId(groupId) });

  res.send({ ok: true });
};

export const QUERY_GROUP_BY_SLUG = gql`
  ${GROUP_FIELDS}
  query GroupBySlug($slug: String!) {
    group(slug: $slug) {
      ...GroupFields
    }
  }
`;
export const getGroupBySlug = async (req, res) => {
  const schema = Joi.object({
    slug: Joi.string().required(),
  });
  const { slug } = validateOrThrow(schema, req.query);
  const data = await gqlRequest(QUERY_GROUP_BY_SLUG, { slug });
  res.json(data?.group);
};
