import { db } from '../db';
import { ObjectId } from 'mongodb';
import Joi from 'joi';
import joiObjectId from 'joi-objectid';
Joi.objectId = joiObjectId(Joi);

import _, { isString, min } from 'lodash';
import axios from 'axios';
import boom from '@hapi/boom';

import { getToken, gqlRequest } from '../services/hylo.service';
import { gql } from 'graphql-request';

const validateOrThrow = (schema, _value) => {
  const { value, error } = schema.validate(_value);
  if (error) {
    const errors = error.details.map((e) => `${e.path.join('.')}: ${e.message}`);
    throw boom.badData(`error: ${errors.join(',')}`);
  }
  return value;
};

const GROUP_QUERY = gql`
  query Group($id: String!) {
    group(id: $id) {
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
  }
`;

const getIntegratedHyloGroupSchema = Joi.object({
  surveyStackGroupId: Joi.string()
    .required()
    .messages({ 'any.required': 'The surveyStackGroupId query parameter is required' }),
});
export const getIntegratedHyloGroup = async (req, res) => {
  const { surveyStackGroupId } = validateOrThrow(getIntegratedHyloGroupSchema, req.query);
  const mapping = await db
    .collection(COLL_HYLO_GROUP_MAPPING)
    .findOne({ groupId: new ObjectId(surveyStackGroupId) });
  if (!mapping) {
    return null;
  }
  const data = await gqlRequest(GROUP_QUERY, { id: mapping.hyloGroupId});
  res.json(data);
};

export const createIntegratedHyloGroup = async (req, res) => {
  res.send('ok');
};

const IS_GROUP_EXIST_QUERY = gql`
  query IsGroupExist($slug: String!) {
    group(slug: $slug) {
      id
    }
  }
`;
const isGroupExistSchema = Joi.object({
  slug: Joi.string()
    .required()
    .messages({ 'any.required': 'The slug query parameter is required' }),
});
export const isGroupExist = async (req, res) => {
  const { slug } = validateOrThrow(isGroupExistSchema, req.query);
  const data = await gqlRequest(IS_GROUP_EXIST_QUERY, { slug });
  res.json({ exist: !!data?.group });
};
