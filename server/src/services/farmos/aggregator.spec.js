import { aggregator } from './aggregator';
import mockAxios from 'axios';
import * as mockResponses from './__mock__/farmos.asset.response';
import { subrequetsResponse } from './__mock__/farmos.surveystackid.response';

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

    process.env = {
      FARMOS_CALLBACK_KEY: 'x',
      FARMOS_AGGREGATOR_URL: 'x',
      FARMOS_AGGREGATOR_APIKEY: 'x',
    };

    const { farminfo } = aggregator(
      process.env.FARMOS_AGGREGATOR_URL,
      process.env.FARMOS_AGGREGATOR_APIKEY
    );

    const r = await farminfo();

    expect(r.data.length).toBe(4);
  });

  it('get-all-terms', async () => {
    let count = 0;
    mockAxios.post.mockImplementation((req) => {
      console.log('request is', req);
      if (count == 0) {
        count++;
        return Promise.resolve({ data: mockResponses.rawSpinachSubrequestsResponse });
      } else {
        count++;
        return Promise.resolve({ data: mockResponses.createSpinachResponse });
      }
    });

    const { getAllTerms } = aggregator(
      process.env.FARMOS_AGGREGATOR_URL,
      process.env.FARMOS_AGGREGATOR_APIKEY
    );

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

  it('get-endpoints-and-bundles', async () => {
    mockAxios.get.mockImplementation((req) => {
      return Promise.resolve({ data: mockResponses.apiResponse });
    });

    mockAxios.post.mockImplementation((req) => {
      return Promise.resolve({ data: subrequetsResponse });
    });

    const { getEndpointsAndBundles, createBodiesForSurveystackGetId } = aggregator(
      process.env.FARMOS_AGGREGATOR_URL,
      process.env.FARMOS_AGGREGATOR_APIKEY
    );

    const endpointsAndBundles = await getEndpointsAndBundles('coffeeshop.farmos.dev');

    expect(endpointsAndBundles).toStrictEqual([
      'asset--animal',
      'asset--equipment',
      'asset--land',
      'asset--material',
      'asset--plant',
      'asset--structure',
      'asset--water',
      'asset_type--asset_type', // must be skipped
      'entity_browser--entity_browser',
      'file--file',
      'flag--flag',
      'lab_test_type--lab_test_type',
      'land_type--land_type',
      'layer_style--layer_style',
      'log--activity',
      'log--harvest',
      'log--input',
      'log--lab_test',
      'log--maintenance',
      'log--observation',
      'log--seeding',
      'log--transplanting',
      'log_type--log_type', // must be skipped
      'map_behavior--map_behavior',
      'map_type--map_type',
      'profile--common',
      'profile--hylo',
      'profile--regen_digital',
      'profile_type--profile_type', // must be skipped
      'quantity--material',
      'quantity--standard',
      'quantity_type--quantity_type',
      'structure_type--structure_type',
      'tag_type--tag_type',
      'taxonomy_term--animal_type',
      'taxonomy_term--crop_family',
      'taxonomy_term--log_category',
      'taxonomy_term--material_type',
      'taxonomy_term--plant_type',
      'taxonomy_term--season',
      'taxonomy_term--unit',
      'taxonomy_vocabulary--taxonomy_vocabulary',
      'user--user',
      'user_role--user_role',
    ]);

    const endpoints = ['asset', 'log', 'profile'];
    const bodies = createBodiesForSurveystackGetId(endpoints, endpointsAndBundles, 123);

    expect(bodies).toStrictEqual([
      {
        uri: 'api/asset/animal?fields[asset--animal]=id&filter[surveystack_id][value]=123',
        action: 'view',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
      },
      {
        uri: 'api/asset/equipment?fields[asset--equipment]=id&filter[surveystack_id][value]=123',
        action: 'view',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
      },
      {
        uri: 'api/asset/land?fields[asset--land]=id&filter[surveystack_id][value]=123',
        action: 'view',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
      },
      {
        uri: 'api/asset/material?fields[asset--material]=id&filter[surveystack_id][value]=123',
        action: 'view',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
      },
      {
        uri: 'api/asset/plant?fields[asset--plant]=id&filter[surveystack_id][value]=123',
        action: 'view',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
      },
      {
        uri: 'api/asset/structure?fields[asset--structure]=id&filter[surveystack_id][value]=123',
        action: 'view',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
      },
      {
        uri: 'api/asset/water?fields[asset--water]=id&filter[surveystack_id][value]=123',
        action: 'view',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
      },
      {
        // must be skipped
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
      },
      {
        uri: 'api/log/harvest?fields[log--harvest]=id&filter[surveystack_id][value]=123',
        action: 'view',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
      },
      {
        uri: 'api/log/input?fields[log--input]=id&filter[surveystack_id][value]=123',
        action: 'view',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
      },
      {
        uri: 'api/log/lab_test?fields[log--lab_test]=id&filter[surveystack_id][value]=123',
        action: 'view',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
      },
      {
        uri: 'api/log/maintenance?fields[log--maintenance]=id&filter[surveystack_id][value]=123',
        action: 'view',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
      },
      {
        uri: 'api/log/observation?fields[log--observation]=id&filter[surveystack_id][value]=123',
        action: 'view',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
      },
      {
        uri: 'api/log/seeding?fields[log--seeding]=id&filter[surveystack_id][value]=123',
        action: 'view',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
      },
      {
        uri: 'api/log/transplanting?fields[log--transplanting]=id&filter[surveystack_id][value]=123',
        action: 'view',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
      },
      {
        uri: 'api/profile/common?fields[profile--common]=id&filter[surveystack_id][value]=123',
        action: 'view',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
      },
      {
        uri: 'api/profile/hylo?fields[profile--hylo]=id&filter[surveystack_id][value]=123',
        action: 'view',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
      },
      {
        uri: 'api/profile/regen_digital?fields[profile--regen_digital]=id&filter[surveystack_id][value]=123',
        action: 'view',
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
      },
    ]);
  });
});
