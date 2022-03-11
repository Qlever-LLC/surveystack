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

  const farminfo = async () => {
    const r = await axios.get(`${apiBase}/farms/`, {
      headers: {
        accept: 'application/json',
        'api-key': aggregatorKey,
      },
      httpsAgent: agent,
    });
    return r;
  };

  const getAssets = async (farmurl, bundle) => {
    const r = await axios.get(
      `${apiBase}/farms/relay/${encodeURIComponent(farmurl)}/api/asset/${bundle}?&fields[asset--${bundle}]=id,name`,
      {
        headers: {
          accept: 'application/json',
          'api-key': aggregatorKey,
        },
        httpsAgent: agent,
      }
    );

    return r;
  };


  const getLogs = async (farmurl, bundle) => {
    const r = await axios.get(
      `${apiBase}/farms/relay/${encodeURIComponent(farmurl)}/api/log/${bundle}?&fields[asset--${bundle}]=id,name`,
      {
        headers: {
          accept: 'application/json',
          'api-key': aggregatorKey,
        },
        httpsAgent: agent,
      }
    );

    return r;
  };

  const createLog = async (farmurl, bundle, log) => {
    const r = await axios.post(
      `${apiBase}/farms/relay/${encodeURIComponent(farmurl)}/api/log/${bundle}?`,
      log,
      {
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          'api-key': aggregatorKey,
        },
        httpsAgent: agent,
      }
    );

    return r;
  };

  const createAsset = async (farmurl, bundle, asset) => {
    const r = await axios.post(
      `${apiBase}/farms/relay/${encodeURIComponent(farmurl)}/api/asset/${bundle}?`,
      asset,
      {
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          'api-key': aggregatorKey,
        },
        httpsAgent: agent,
      }
    );

    return r;
  };

  const subrequest = async (farmurl, req) => {
    const r = await axios.post(
      `${apiBase}/farms/relay/${encodeURIComponent(farmurl)}/subrequests?`,
      req,
      {
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          'api-key': aggregatorKey,
        },
        httpsAgent: agent,
      }
    );

    return r;
  };

  const getTaxonomy = async (farmurl, bundle) => {
    const r = await axios.get(
      `${apiBase}/farms/relay/${encodeURIComponent(farmurl)}/api/taxonomy_term/${bundle}?`,
      {
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          'api-key': aggregatorKey,
        },
        httpsAgent: agent,
      }
    );

    return r;
  };

  const deleteAllWithData = async (farmurl, data) => {
    const assetBundles = [
      'plant',
      'land',
      'structure'
    ];

    const logBundles = [
      'activity',
      'input',
      'observation',
      'seeding',
      'transplanting'
    ];

    const assetSubRequestUrls = assetBundles.map(bundle => `api/asset/${bundle}?fields[asset--${bundle}]=id&filter[data][value]=${data}`)
    const logSubRequestUrls = logBundles.map(bundle => `api/log/${bundle}?fields[log--${bundle}]=id&filter[data][value]=${data}`)

    const subrequests = [...assetSubRequestUrls, ...logSubRequestUrls];

    const body = subrequests.map(s => ({
      uri: s,
      action: "view",
      headers: {
        "Accept": "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json"
      }
    }))

    const r = await axios.post(
      `${apiBase}/farms/relay/${farmurl}/subrequests?_format=json`, body, {
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        'api-key': aggregatorKey,
      },
      httpsAgent: agent,
    })

    // console.log('data', r.data);
    const items = [];
    for (const k of Object.keys(r.data)) {
      const res = JSON.parse(r.data[k].body);
      // console.log('parsed', res);
      items.push(...res.data);
    }


    const deleteUrls = items.map(item => {
      const [ep, bundle] = item.type.split('--');
      return `api/${ep}/${bundle}/${item.id}`
    })

    // console.log("deleteUrls", deleteUrls);


    const deleteBody = deleteUrls.map(s => ({
      uri: s,
      action: "delete",
      headers: {
        "Accept": "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json"
      }
    }))


    await axios.post(
      `${apiBase}/farms/relay/${farmurl}/subrequests?_format=json`, deleteBody, {
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        'api-key': aggregatorKey,
      },
      httpsAgent: agent,
    })
  }

  return {
    farminfo,
    getTaxonomy,
    getAssets,
    getLogs,
    createLog,
    createAsset,
    subrequest,
    deleteAllWithData
  };
};
