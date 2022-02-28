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

    console.log('fetching', r);

    return r;
  };

  const getAssets = async (farmurl, bundle) => {
    const r = await axios.get(
      `${apiBase}/farms/relay/api/asset/${bundle}?farm_url=${encodeURIComponent(farmurl)}`,
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
      `${apiBase}/farms/relay/api/log/${bundle}?farm_url=${encodeURIComponent(farmurl)}`,
      log,
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

  return {
    farminfo,
    getAssets,
    createLog,
  };
};
