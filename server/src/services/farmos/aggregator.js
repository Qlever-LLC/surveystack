import boom from '@hapi/boom';
import { triggerAsyncId } from 'async_hooks';
import axios from 'axios';
import https from 'https';
import _ from 'lodash';

export const aggregator = (aggregatorURL, aggregatorKey) => {
  const apiBase = `https://${aggregatorURL}/api/v2`;

  const agentOptions = {
    host: aggregatorURL,
    port: '443',
    path: '/',
    rejectUnauthorized: false,
  };

  const agent = new https.Agent(agentOptions);
  const opts = {
    headers: {
      accept: 'application/json',
      'api-key': aggregatorKey,
      'Content-Type': 'application/json',
    },
    httpsAgent: agent,
  };

  const farminfo = async () => {
    const r = await axios.get(`${apiBase}/farms/`, {
      ...opts,
    });
    return r;
  };

  const getAssets = async (farmurl, bundle) => {
    const r = await axios.get(
      `${apiBase}/farms/relay/${encodeURIComponent(
        farmurl
      )}/api/asset/${bundle}?&fields[asset--${bundle}]=id,name,archived,location`,
      {
        ...opts,
      }
    );

    return r;
  };

  const getLogs = async (farmurl, bundle) => {
    const r = await axios.get(
      `${apiBase}/farms/relay/${encodeURIComponent(
        farmurl
      )}/api/log/${bundle}?&fields[log--${bundle}]=id,name`,
      {
        ...opts,
      }
    );

    return r;
  };

  const createLog = async (farmurl, bundle, log) => {
    const r = await axios.post(
      `${apiBase}/farms/relay/${encodeURIComponent(farmurl)}/api/log/${bundle}?`,
      log,
      {
        ...opts,
      }
    );

    return r;
  };

  const createAsset = async (farmurl, bundle, asset) => {
    const r = await axios.post(
      `${apiBase}/farms/relay/${encodeURIComponent(farmurl)}/api/asset/${bundle}?`,
      asset,
      {
        ...opts,
      }
    );

    return r;
  };

  const create = async (farmurl, endpoint, bundle, entity) => {
    const r = await axios.post(
      `${apiBase}/farms/relay/${encodeURIComponent(farmurl)}/api/${endpoint}/${bundle}`,
      entity,
      {
        ...opts,
      }
    );

    return r;
  };

  const subrequest = async (farmurl, req) => {
    const r = await axios.post(
      `${apiBase}/farms/relay/${encodeURIComponent(farmurl)}/subrequests?`,
      req,
      {
        ...opts,
      }
    );

    return r;
  };

  const getTaxonomy = async (farmurl, bundle) => {
    const r = await axios.get(
      `${apiBase}/farms/relay/${encodeURIComponent(farmurl)}/api/taxonomy_term/${bundle}?`,
      {
        ...opts,
      }
    );

    return r;
  };

  const getAllTerms = async (farmurl, items) => {
    const body = items.map((item) => {
      const { endpoint, bundle, name } = item;

      return {
        uri: `api/${endpoint}/${bundle}/?fields[${endpoint}--${bundle}]=name,id&filter[name][value]=${name}`,
        action: 'view',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
      };
    });

    if (body.length == 0) {
      return {};
    }

    const r = await axios.post(`${apiBase}/farms/relay/${farmurl}/subrequests?_format=json`, body, {
      ...opts,
    });

    const responses = [];

    for (const k of Object.keys(r.data)) {
      const res = JSON.parse(r.data[k].body);
      responses.push(res.data);
      if (res.errors && res.errors.length > 0) {
        throw boom.badData(res.errors.map((e) => e.detail).join(', '));
      }
    }

    const res = [];

    const missingTerms = [];
    let count = 0;
    for (const response of responses) {
      if (response.length > 0) {
        const [endpoint, bundle] = response[0].type.split('--');
        res.push({
          endpoint,
          bundle,
          id: response[0].id,
          name: response[0].attributes.name,
        });
      } else {
        missingTerms.push(items[count]);
      }
      count++;
    }

    const createBody = missingTerms.map((item) => {
      const { endpoint, bundle, name } = item;

      return {
        uri: `api/${endpoint}/${bundle}`,
        action: 'create',
        body: `{"data":{"type":"${endpoint}--${bundle}","attributes":{"name":"${name}"}}}`,
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
      };
    });

    if (createBody.length > 0) {
      const createdTypes = await axios.post(
        `${apiBase}/farms/relay/${farmurl}/subrequests?_format=json`,
        createBody,
        {
          ...opts,
        }
      );

      const createResponses = [];

      for (const k of Object.keys(createdTypes.data)) {
        const createResponseBody = JSON.parse(createdTypes.data[k].body);
        createResponses.push(createResponseBody.data);
      }

      for (const response of createResponses) {
        const [endpoint, bundle] = response.type.split('--');
        res.push({
          endpoint,
          bundle,
          id: response.id,
          name: response.attributes.name,
        });
      }
    }

    return res;
  };

  const getEndpointsAndBundles = async (farmurl) => {
    const { data: apiResponse } = await axios.get(`${apiBase}/farms/relay/${farmurl}/api`, {
      ...opts,
    });

    return _.uniq(_.keys(apiResponse.links).filter((k) => k.includes('--')));
  };

  const createBodiesForSurveystackGetId = (endpoints, endpointsAndBundles, surveystackId) => {
    const endpointAndBundles = endpointsAndBundles
      .map((entry) => {
        const [endpoint, bundle] = entry.split('--');
        return {
          endpoint,
          bundle,
        };
      })
      .filter((e) => {
        let include = false;
        for (const ep of endpoints) {
          if (e.endpoint === ep) {
            include = true;
            break;
          }
        }
        return include;
      });

    const bodies = endpointAndBundles.map((entry) => ({
      uri: `api/${entry.endpoint}/${entry.bundle}?fields[${entry.endpoint}--${entry.bundle}]=id&filter[surveystack_id][value]=${surveystackId}`,
      action: 'view',
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
    }));

    return bodies;
  };

  const deleteAllWithSurveystackId = async (farmurl, surveystackId) => {
    // fetch all bundles of endpoints

    const endpoints = ['asset', 'log', 'profile'];

    const endpointsAndBundles = await getEndpointsAndBundles(farmurl);
    const bodies = createBodiesForSurveystackGetId(endpoints, endpointsAndBundles, surveystackId);

    const r = await axios.post(
      `${apiBase}/farms/relay/${farmurl}/subrequests?_format=json`,
      bodies,
      {
        ...opts,
      }
    );

    // console.log('data', r.data);
    const items = [];

    for (const k of Object.keys(r.data)) {
      const res = JSON.parse(r.data[k].body);
      // console.log('parsed', res);
      if (!res.data || !Array.isArray(res.data)) {
        // probably no item with surveystack_id, skip
        continue;
      }
      items.push(...res.data);
    }

    const deleteUrls = items.map((item) => {
      const [ep, bundle] = item.type.split('--');
      return `api/${ep}/${bundle}/${item.id}`;
    });

    // console.log("deleteUrls", deleteUrls);

    const deleteBody = deleteUrls.map((s) => ({
      uri: s,
      action: 'delete',
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
    }));

    if (deleteBody.length == 0) {
      return {};
    }

    return await axios.post(
      `${apiBase}/farms/relay/${farmurl}/subrequests?_format=json`,
      deleteBody,
      {
        ...opts,
      }
    );
  };

  const getFarmsWithTag = async (tag) => {
    const r = await axios.get(`${apiBase}/farms`, { ...opts });
    if (!r.data) {
      return [];
    }
    return r.data.filter((farm) => farm.tags.includes(tag)).map((farm) => farm.url);
  };

  const getAllFarmsWithTags = async () => {
    const r = await axios.get(`${apiBase}/farms`, { ...opts });
    if (!r.data) {
      return [];
    }
    return r.data.map((farm) => ({
      url: farm.url,
      tags: farm.tags,
    }));
  };

  const getAdminLink = async (farmurl) => {
    const r = await axios.get(`${apiBase}/farms/relay/${encodeURIComponent(farmurl)}/api/login?`, {
      ...opts,
    });

    return r.data;
  };

  return {
    farminfo,
    getTaxonomy,
    getAssets,
    getLogs,
    createLog,
    createAsset,
    create,
    subrequest,
    deleteAllWithSurveystackId,
    getFarmsWithTag,
    getAllFarmsWithTags,
    getAllTerms,
    getEndpointsAndBundles,
    createBodiesForSurveystackGetId,
    getAdminLink,
  };
};
