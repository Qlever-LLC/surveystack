import { aggregator } from './aggregator';
import mockAxios from 'axios';

require('dotenv').config();

describe('fetching farminfo', () => {
  it('farminfo', async () => {
    const mockresponse = [
      {
        farm_name: 'farm1.farmos.dev',
        url: 'farm1.farmos.dev',
        notes: '',
        tags: '',
        active: true,
        token: [Object],
        id: 3,
        time_created: '2022-02-18T12:43:30.943821+00:00',
        time_updated: '2022-02-21T17:27:56.637140+00:00',
        last_accessed: '2022-02-18T12:47:36.165426+00:00',
        is_authorized: true,
        scope: 'farm_manager ',
        auth_error: null,
      },
      {
        farm_name: 'farm2.farmos.dev',
        url: 'farm2.farmos.dev',
        notes: '',
        tags: '',
        active: true,
        token: [Object],
        id: 8,
        time_created: '2022-02-18T12:44:22.416590+00:00',
        time_updated: '2022-02-21T17:28:13.519961+00:00',
        last_accessed: '2022-02-18T12:48:09.734022+00:00',
        is_authorized: true,
        scope: 'farm_manager ',
        auth_error: null,
      },
      {
        farm_name: 'farm3.farmos.dev',
        url: 'farm3.farmos.dev',
        notes: '',
        tags: '',
        active: true,
        token: [Object],
        id: 2,
        time_created: '2022-02-18T12:43:09.379291+00:00',
        time_updated: '2022-02-21T17:28:19.982895+00:00',
        last_accessed: '2022-02-18T12:48:28.516915+00:00',
        is_authorized: true,
        scope: 'farm_manager ',
        auth_error: null,
      },
      {
        farm_name: 'farm4.farmos.dev',
        url: 'farm4.farmos.dev',
        notes: '',
        tags: '',
        active: true,
        token: [Object],
        id: 7,
        time_created: '2022-02-18T12:44:11.953864+00:00',
        time_updated: '2022-02-21T17:28:22.828344+00:00',
        last_accessed: '2022-02-18T12:48:46.385681+00:00',
        is_authorized: true,
        scope: 'farm_manager ',
        auth_error: null,
      },
    ];

    let res = { data: mockresponse };
    mockAxios.get.mockImplementation(() => Promise.resolve(res));

    if (!process.env.FARMOS_AGGREGATOR_URL || !process.env.FARMOS_AGGREGATOR_APIKEY) {
      console.log('env not set');
      return;
    }

    const { farminfo } = aggregator(
      process.env.FARMOS_AGGREGATOR_URL,
      process.env.FARMOS_AGGREGATOR_APIKEY
    );

    const r = await farminfo();

    expect(r.data.length).toBe(4);
  });
});
