import boom from '@hapi/boom';
import axios from 'axios';
import { ObjectId } from 'mongodb';
import querystring from 'querystring';

import * as utils from '../helpers/surveys';

import { db } from '../db';
import { request, gql } from 'graphql-request';

export const getToken = async () => {
  const r = await axios.post(
    `${process.env.HYLO_API_URL}/noo/oauth/token`,
    querystring.stringify({
      client_secret: process.env.HYLO_CLIENT_SECRET,
      scope: 'api:write',
      resource: 'https://hylo.com ',
      audience: 'https://hylo.com',
      grant_type: 'client_credentials',
      client_id: 'openteam',
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return r.data;
};

const gqlPostConfig = async () => {
  return {
    headers: {
      Authorization: `Bearer ${(await getToken()).access_token}`,
      'Content-Type': 'application/json',
    },
  };
};

const getGqlAuthHeaders = async () => {
  return {
    Authorization: `Bearer ${(await getToken()).access_token}`,
  };
};

export const gqlRequest = async (query, variables) => {
  return request(
    `${process.env.HYLO_API_URL}/noo/graphql`,
    query,
    variables,
    await getGqlAuthHeaders()
  );
};