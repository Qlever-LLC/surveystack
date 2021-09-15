import axios from 'axios';
import https from 'https';

async function farminfo(aggregatorURL, aggregatorKey) {
  const agentOptions = {
    host: aggregatorURL,
    port: '443',
    path: '/',
    rejectUnauthorized: false,
  };

  const agent = new https.Agent(agentOptions);

  const r = await axios.get(`https://${aggregatorURL}/api/v1/farms/`, {
    headers: {
      accept: 'application/json',
      'api-key': aggregatorKey,
    },
    httpsAgent: agent,
  });

  return r;
}

export { farminfo };
