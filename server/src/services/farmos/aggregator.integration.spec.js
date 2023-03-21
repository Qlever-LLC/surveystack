/* istanbul ignore file */

import uuid from 'uuid';
import { aggregator } from './aggregator';

const TEST_FARM = 'buddingmoonfarm.farmos.dev';

require('dotenv').config();
jest.unmock('axios');

const config = () => {
  if (!process.env.FARMOS_AGGREGATOR_URL || !process.env.FARMOS_AGGREGATOR_APIKEY) {
    console.log('env not set');
    return;
  }

  return aggregator(process.env.FARMOS_AGGREGATOR_URL, process.env.FARMOS_AGGREGATOR_APIKEY);
};

jest.setTimeout(60000);

describe('test-aggregator-integration', () => {
  it('farminfo', async () => {
    const { farminfo, getAssets, createLog } = config();

    const r = await farminfo();
    console.log('result', r.data);
  });

  it('get-assets', async () => {
    jest.setTimeout(10000);
    const { farminfo, getAssets, createLog } = config();

    const assets = await getAssets(TEST_FARM, 'plant');
    console.log('assets', JSON.stringify(assets.data, null, 2));
  });

  it('create-log', async () => {
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
    await createLog(TEST_FARM, 'activity', log);
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
      const r = await subrequest(TEST_FARM, req);
      console.log(r);
    } catch (error) {
      console.log(error);
    }
  });
  it('create-planting-in-field', async () => {
    // create planting in a field and a log referencing it

    const { createAsset, getTaxonomy, getAssets, createLog } = config();

    const { data: plants } = await getTaxonomy(TEST_FARM, 'plant_type');
    const { data: fields } = await getAssets(TEST_FARM, 'land');
    const id = fields.data[0].id;

    const plantTypes = plants.data.map((p) => {
      return {
        id: p.id,
        name: p.attributes.name,
      };
    });

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
                id: id,
              },
            ],
          },
        },
      },
    };

    const assetRes = await createAsset(TEST_FARM, 'plant', asset);
    expect(assetRes.status).toBe(201);

    const log = {
      data: {
        type: 'log--activity',
        attributes: {
          name: 'Test activity log via API',
          timestamp: 1645801459,
          status: 'done',
        },
        relationships: {
          asset: {
            id,
          },
        },
      },
    };

    const logres = await createLog(TEST_FARM, 'activity', log);
    expect(logres.status).toBe(201);
    console.log('id', logres.data.data.id);
  });

  it('create-and-delete-log', async () => {
    const { farminfo, getAssets, createLog, getLogs, deleteAllWithSurveystackId } = config();

    const id = uuid.v4();
    const data = uuid.v4();
    const log = {
      data: {
        id,
        type: 'log--activity',
        attributes: {
          name: 'Test activity log via API',
          timestamp: 1645801459,
          status: 'done',
          data,
        },
      },
    };

    await createLog(TEST_FARM, 'activity', log);

    const { data: logs } = await getLogs(TEST_FARM, 'activity');
    let ids = logs.data.map((l) => l.id);

    expect(ids.includes(id)).toBe(true);

    await deleteAllWithSurveystackId(TEST_FARM, data);

    const { data: logsAfterDeletion } = await getLogs(TEST_FARM, 'activity');
    ids = logsAfterDeletion.data.map((l) => l.id);
    expect(ids.includes(id)).toBe(false);
  });
  it('log-response', async () => {
    const { farminfo, getAssets, createLog, getLogs, deleteAllWithSurveystackId } = config();

    const { data: logs } = await getLogs(TEST_FARM, 'activity');
    console.log('data', JSON.stringify(logs, null, 2));
  });
  it('farms-by-tag', async () => {
    const { getFarmsWithTag, getAllFarmsWithTags } = config();

    console.log(await getFarmsWithTag('/bionutrient/partners/main/'));
    console.log(await getAllFarmsWithTags());
  });
  it('get-all-terms', async () => {
    const { getAllTerms } = config();
    const arg = {
      'oursci.farmos.dev': [
        {
          endpoint: 'taxonomy_term',
          bundle: 'plant_type',
          name: 'Spinach',
        },
      ],
    };

    for (const url of Object.keys(arg)) {
      const res = await getAllTerms(url, arg[url]);
      expect(res).toStrictEqual([
        {
          endpoint: 'taxonomy_term',
          bundle: 'plant_type',
          name: 'spinach',
          id: '0548b26f-effa-43b4-be41-fb5f443cd119',
        },
      ]);
    }
  });
  it('delete-all-with-id', async () => {
    const { deleteAllWithSurveystackId } = config();

    try {
      console.log(await deleteAllWithSurveystackId('coffeeshop.farmos.dev', '123'));
    } catch (error) {
      console.error(error);
    }
  });
  it.only('integration-test-skipping', async () => {});
});
