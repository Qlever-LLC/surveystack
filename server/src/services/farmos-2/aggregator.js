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

  const asset = async () => {};

  return {
    farminfo,
  };
};
