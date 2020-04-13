import { networkInterfaces } from 'os';

const getLocalExternalIP = () =>
  []
    .concat(...Object.values(networkInterfaces()))
    .filter((details) => details.family === 'IPv4' && !details.internal)
    .pop().address;

const getIP = (req, res) => {
  const address = getLocalExternalIP();
  return res.send(address);
};

export default {
  getIP,
};
