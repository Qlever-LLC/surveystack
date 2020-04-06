import axios from 'axios';
import https from 'https';

async function aggregatorRequest(
  aggregatorURL,
  aggregatorKey,
  farmUrl,
  endpoint,
  method,
  body,
  instanceIdQuery
) {
  const agentOptions = {
    host: aggregatorURL,
    port: '443',
    path: '/',
    rejectUnauthorized: false,
  };

  const agent = new https.Agent(agentOptions);

  let url = `https://${aggregatorURL}/api/v1/farms/${endpoint}/?farm_url=${encodeURIComponent(
    farmUrl
  )}`;

  if (instanceIdQuery) {
    url += '&data=' + encodeURIComponent(instanceIdQuery);
  }

  const config = {
    method,
    url,
    headers: {
      accept: 'application/json',
      'api-key': aggregatorKey,
    },
    httpsAgent: agent,
    data: body,
  };

  if (method.toLowerCase() === 'post') {
    config.headers['Content-Type'] = 'application/json';
  }

  const response = await axios(config);
  //console.log('response', response);
  const r = response.data;

  const farmId = Object.keys(r)[0];
  return r[farmId];
}

export { aggregatorRequest };
