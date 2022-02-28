import { create } from 'lodash';
import uuid from 'uuid';
import { aggregator } from './aggregator';

require('dotenv').config();

const config = () => {
  if (!process.env.FARMOS_AGGREGATOR_URL || !process.env.FARMOS_AGGREGATOR_APIKEY) {
    console.log('env not set');
    return;
  }

  return aggregator(process.env.FARMOS_AGGREGATOR_URL, process.env.FARMOS_AGGREGATOR_APIKEY);
};

describe('fetching farminfo', () => {
  it('farminfo', async () => {
    const { farminfo, getAssets, createLog } = config();

    const r = await farminfo();
    console.log('result', r.data);
  });
  it('assets', async () => {
    const { farminfo, getAssets, createLog } = config();

    const assets = await getAssets('apricotlanefarms.farmos.dev', 'land');
    console.log('assets', assets.data);
  });

  it('createlog', async () => {
    const { farminfo, getAssets, createLog } = config();

    const id = uuid.v4();
    const log = {
      id,
      type: 'log--activity',
      attributes: {
        name: 'Node Test',
        timestamp: '2021-04-26T09:18:33Z',
      },
    };

    console.log('log', log);
    const logres = await createLog('apricotlanefarms.farmos.dev', 'activity', log);

    console.log('log result', logres.data);
  });
});
