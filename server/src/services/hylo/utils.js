import axios from 'axios';
import querystring from 'querystring';

import { request } from 'graphql-request';

export const getToken = async (apiUrl = process.env.HYLO_API_URL) => {
  const r = await axios.post(
    `${apiUrl}/noo/oauth/token`,
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

export const postHyloUser = async (body, apiUrl = process.env.HYLO_API_URL) => {
  return await axios.post(`${apiUrl}/noo/user`, body, {
    headers: {
      ...(await getGqlAuthHeaders(apiUrl)),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
};

const getGqlAuthHeaders = async (apiUrl = process.env.HYLO_API_URL) => {
  return {
    Authorization: `Bearer ${(await getToken(apiUrl)).access_token}`,
  };
};

export const gqlRequest = async (query, variables, apiUrl = process.env.HYLO_API_URL) => {
  return request(apiUrl + '/noo/graphql', query, variables, await getGqlAuthHeaders(apiUrl)).catch(
    async (e) => {
      if (e?.response?.errors) {
        e.message =
          e.response.errors.map((e) => e.message).join('\n') +
          ' in ' +
          query +
          JSON.stringify(variables, null, 2);
      }
      throw e;
    }
  );
};

export const gqlRequestWithUrl = (apiUrl) => {
  if (!apiUrl.match(/(^|\.|\/)hylo.com$/)) {
    throw new Error('Hylo API URL has to be under hylo.com');
  }
  return (query, variables) => gqlRequest(query, variables, apiUrl);
};
