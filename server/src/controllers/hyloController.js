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

export const getIntegratedHyloGroup = (req, res) => {
  res.send('ok');
};

export const createIntegratedHyloGroup = (req, res) => {
  res.send('ok');
};

const validateOrThrow = (schema, _value) => {
  const { value, error } = schema.validate(_value);
  if (error) {
    const errors = error.details.map((e) => `${e.path.join('.')}: ${e.message}`);
    throw boom.badData(`error: ${errors.join(',')}`);
  }
  return value;
};

const isGroupExistSchema = Joi.object({
  slug: Joi.string()
    .required()
    .messages({ 'any.required': 'The slug query parameter is required' }),
});
const IS_GROUP_EXIST_QUERY = gql`
  query IsGroupExist($slug: String!) {
    group(slug: $slug) {
      id
    }
  }
`;
export const isGroupExist = async (req, res) => {
  const { slug } = validateOrThrow(isGroupExistSchema, req.query);
  const data = await gqlRequest(IS_GROUP_EXIST_QUERY, { slug });
  res.json({ exist: !!data?.group });
};
