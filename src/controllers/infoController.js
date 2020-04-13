import { networkInterfaces } from 'os';
import axios from 'axios';

const getLocalExternalIP = () =>
  []
    .concat(...Object.values(networkInterfaces()))
    .filter((details) => details.family === 'IPv4' && !details.internal)
    .pop().address;

const getIP = (req, res) => {
  const address = getLocalExternalIP();
  return res.send(address);
};

const getPublicIP = async (req, res) => {
  const { data: address } = await axios.get('http://instance-data/latest/meta-data/public-ipv4');
  return res.send(address);
};

export default {
  getIP,
  getPublicIP,
};
