import { create } from 'lodash';
import uuid from 'uuid';
import { getAssets } from '../../controllers/farmos2Controller';
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

  it('get assets', async () => {
    jest.setTimeout(10000);
    const { farminfo, getAssets, createLog } = config();

    const assets = await getAssets('buddingmoonfarm.farmos.dev', 'plant');
    console.log('assets', JSON.stringify(assets.data, null, 2));
  });

  it('create log', async () => {
    const { farminfo, getAssets, createLog } = config();

    const id = uuid.v4();
    const log = {
      data: {
        id,
        type: 'log--activity',
        attributes: {
          name: 'Test activity log via API',
          timestamp: 1645801459,
          status: 'done',
        },
      },
    };

    console.log('log', log);
    try {
      const logres = await createLog('buddingmoonfarm.farmos.dev', 'activity', log);
      console.log('log result', logres.data);
    } catch (error) {
      console.log(error);
    }
  });
  it('subrequest', async () => {
    const { subrequest } = config();
    const req = {
      data: [
        {
          requestId: 'req1',
          action: 'view',
          uri: '/api',
        },
      ],
    };

    try {
      const r = await subrequest('buddingmoonfarm.farmos.dev', req);
      console.log(r);
    } catch (error) {
      console.log(error);
    }
  });
  it('create asset', async () => {
    const { createAsset, getTaxonomy, getAssets } = config();


    const { data: plants } = await getTaxonomy('buddingmoonfarm.farmos.dev', 'plant_type');
    const { data: fields } = await getAssets('buddingmoonfarm.farmos.dev', 'land');
    const fieldId = fields.data[0].id;

    const plantTypes = plants.data.map((p) => {
      return {
        id: p.id,
        name: p.attributes.name,
      };
    });
    console.log('plant types', plantTypes);

    const chioggia = plantTypes.find((p) => p.name == 'Chioggia');

    const id = uuid.v4();

    const asset = {
      data: {
        id,
        type: 'asset--plant',
        attributes: {
          name: 'Test plant Asset',
          status: 'active',
          geometry: '',
        },
        relationships: {
          plant_type: {
            data: [
              {
                type: 'taxonomy_term--plant_type',
                id: chioggia.id,
              },
            ],
          },
          asset: {
            data: [
              {
                type: 'asset--land',
                id: fieldId,
              },
            ]
          }
        },
      },
    };

    console.log('asset', asset);
    try {
      const logres = await createAsset('buddingmoonfarm.farmos.dev', 'plant', asset);
      console.log('log result', logres.data);
    } catch (error) {
      console.log(error);
    }
  });
});
