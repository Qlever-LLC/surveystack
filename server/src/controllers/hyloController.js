import { COLL_GROUPS_HYLO_MAPPINGS, db } from '../db';
import { ObjectId } from 'mongodb';
import Joi from 'joi';
import joiObjectId from 'joi-objectid';
Joi.objectId = joiObjectId(Joi);

import _, { isString, min } from 'lodash';
import boom from '@hapi/boom';

import { gqlRequest } from '../services/hylo/utils';
import { gql } from 'graphql-request';

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

export const getIntegratedHyloGroup = async (req, res) => {
  const QUERY = gql`
    ${GROUP_FIELDS}
    query Group($id: ID!) {
      group(id: $id) {
        ...GroupFields
      }
    }
  `;

  const schema = Joi.object({
    groupId: Joi.string()
      .required()
      .messages({ 'any.req  uired': 'The groupId query parameter is required' }),
  });

  console.log('getIntegratedHyloGroup');
  const { groupId } = validateOrThrow(schema, req.params);
  console.log('groupId', groupId);
  const mapping = await db
    .collection(COLL_GROUPS_HYLO_MAPPINGS)
    .findOne({ groupId: new ObjectId(groupId) });
  console.log({ mapping });
  if (!mapping) {
    return res.json(null);
  }
  const data = await gqlRequest(QUERY, { id: mapping.hyloGroupId });
  res.json(data?.group);
};

export const createNewIntegratedHyloGroup = async (req, res) => {
  const MUTATION = gql`
    mutation ($data: GroupInput, $asUserId: ID) {
      group: createGroup(data: $data, asUserId: $asUserId) {
        ...GroupFields
      }
    }
    ${GROUP_FIELDS}
  `;
  const schema = Joi.object({
    groupId: Joi.string().required(),
  });

  const { groupId } = validateOrThrow(schema, req.body);

  const group = await db.collection('groups').findOne({ _id: new ObjectId(groupId) });
  if (!group) {
    throw boom.notFound(`Can't find SurveyStack group with the ID "${groupId}`);
  }

  let hyloGroup = null;
  for (let postfix = 0; postfix <= 12; postfix++) {
    const slug = postfix === 0 ? group.slug : `${group.slug}-${postfix}`;
    try {
      const variables = {
        data: {
          accessibility: 1,
          name: group.name,
          slug,
          parentIds: [],
          visibility: 1,
        },
        asUserId: 'TODO hyloUserId',
      };
      // TODO create/find Hylo user for admin
      // hyloGroup = (await createHyloGroup({ name, slug, farm_url, hyloUserId })).group;
    } catch (e) {
      if (
        !e.response?.errors?.some((e) => e.message === 'A group with that URL slug already exists')
      ) {
        throw e;
      }
    }
  }
  if (!hyloGroup) {
    throw boom.conflict(`The slug "${group.slug} is already taken on Hylo`);
  }

  // TODO save in DB and return group
};

export const setIntegratedHyloGroup = async (req, res) => {
  const QUERY = gql`
    ${GROUP_FIELDS}
    query GroupId($id: ID!) {
      group(id: $id) {
        ...GroupFields
      }
    }
  `;

  const schema = Joi.object({
    hyloGroupId: Joi.string().required(),
    surveyStackGroupId: Joi.string().required(),
  });

  const { hyloGroupId, surveyStackGroupId } = validateOrThrow(schema, req.body);

  const hyloGroup = (await gqlRequest(QUERY, { id: hyloGroupId }))?.group;
  if (!hyloGroup) {
    throw boom.notFound(`Can't find Hylo group with the ID "${hyloGroupId}`);
  }

  const groupId = (await db.collection('groups').findOne({ _id: new ObjectId(surveyStackGroupId) }))
    ?._id;
  if (!groupId) {
    throw boom.notFound(`Can't find SurveyStack group with the ID "${surveyStackGroupId}`);
  }

  await db
    .collection(COLL_GROUPS_HYLO_MAPPINGS)
    .updateOne({ groupId }, { $set: { hyloGroupId } }, { upsert: true });

  res.send(hyloGroup);
};
export const removeHyloGroupIntegration = async (req, res) => {
  // TODO check for access rights
  const schema = Joi.object({
    groupId: Joi.string().required(),
  });

  const { groupId } = validateOrThrow(schema, req.body);

  await db.collection(COLL_GROUPS_HYLO_MAPPINGS).deleteOne({ groupId: new ObjectId(groupId) });

  res.send({ ok: true });
};

export const getGroupBySlug = async (req, res) => {
  const QUERY = gql`
    ${GROUP_FIELDS}
    query Group($slug: String!) {
      group(slug: $slug) {
        ...GroupFields
      }
    }
  `;
  const schema = Joi.object({
    slug: Joi.string().required(),
  });
  const { slug } = validateOrThrow(schema, req.query);
  const data = await gqlRequest(QUERY, { slug });
  res.json(data?.group);
};
