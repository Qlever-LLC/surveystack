import { triggerAsyncId } from 'async_hooks';
import axios from 'axios';
import https from 'https';

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
      )}/api/asset/${bundle}?&fields[asset--${bundle}]=id,name`,
      ...opts
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

  const getAllTaxonomy = async (farmurl) => {
    const bundles = [];
  };

  const deleteAllWithData = async (farmurl, data) => {
    const assetBundles = ['plant', 'land', 'structure'];

    const logBundles = ['activity', 'input', 'observation', 'seeding', 'transplanting'];

    const assetSubRequestUrls = assetBundles.map(
      (bundle) => `api/asset/${bundle}?fields[asset--${bundle}]=id&filter[data][value]=${data}`
    );
    const logSubRequestUrls = logBundles.map(
      (bundle) => `api/log/${bundle}?fields[log--${bundle}]=id&filter[data][value]=${data}`
    );

    const subrequests = [...assetSubRequestUrls, ...logSubRequestUrls];

    const body = subrequests.map((s) => ({
      uri: s,
      action: 'view',
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
    }));

    const r = await axios.post(`${apiBase}/farms/relay/${farmurl}/subrequests?_format=json`, body, {
      ...opts,
    });

    // console.log('data', r.data);
    const items = [];
    for (const k of Object.keys(r.data)) {
      const res = JSON.parse(r.data[k].body);
      // console.log('parsed', res);
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

    await axios.post(`${apiBase}/farms/relay/${farmurl}/subrequests?_format=json`, deleteBody, {
      ...opts,
    });
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

  return {
    farminfo,
    getTaxonomy,
    getAssets,
    getLogs,
    createLog,
    createAsset,
    subrequest,
    deleteAllWithData,
    getFarmsWithTag,
    getAllFarmsWithTags,
  };
};
