import { getTerms, substitue } from './farmos.service';

describe('farmos-service', () => {
  it('get-terms', async () => {
    const apiCompose = [
      {
        type: 'farmos',
        url: 'oursci.farmos.dev',
        entity: {
          type: 'asset--plant',
          attributes: {
            name: 'Test plant Asset',
            status: 'active',
            geometry: '',
            data: '123',
          },
          relationships: {
            plant_type: {
              data: [
                {
                  type: 'taxonomy_term--plant_type',
                  name: 'Spinach',
                },
              ],
            },
          },
        },
      },
    ];
    const res = getTerms(apiCompose);

    expect(res).toStrictEqual({
      'oursci.farmos.dev': [
        {
          endpoint: 'taxonomy_term',
          bundle: 'plant_type',
          name: 'Spinach',
        },
      ],
    });
  });

  it('get-terms-duplicate', async () => {
    const apiCompose = [
      {
        type: 'farmos',
        url: 'oursci.farmos.dev',
        entity: {
          type: 'asset--plant',
          attributes: {
            name: 'Test plant Asset',
            status: 'active',
            geometry: '',
            surveystack_id: '12',
          },
          relationships: {
            plant_type: {
              data: [
                {
                  type: 'taxonomy_term--plant_type',
                  name: 'Spinach',
                },
              ],
            },
          },
        },
      },
      {
        type: 'farmos',
        url: 'oursci.farmos.dev',
        entity: {
          type: 'asset--plant',
          attributes: {
            name: 'Another Plant Asset, also Spinach',
            status: 'active',
            geometry: '',
            surveystack_id: '12',
          },
          relationships: {
            plant_type: {
              data: [
                {
                  type: 'taxonomy_term--plant_type',
                  name: 'Spinach',
                },
              ],
            },
          },
        },
      },
    ];
    const res = getTerms(apiCompose);

    // should equal the same
    expect(res).toStrictEqual({
      'oursci.farmos.dev': [
        {
          endpoint: 'taxonomy_term',
          bundle: 'plant_type',
          name: 'Spinach',
        },
      ],
    });
  });

  it('get-terms-multidomain', async () => {
    const apiCompose = [
      {
        type: 'farmos',
        url: 'oursci.farmos.dev',
        entity: {
          type: 'asset--plant',
          attributes: {
            name: 'Test plant Asset',
            status: 'active',
            geometry: '',
            surveystack_id: '12',
          },
          relationships: {
            plant_type: {
              data: [
                {
                  type: 'taxonomy_term--plant_type',
                  name: 'Spinach',
                },
              ],
            },
          },
        },
      },
      {
        type: 'farmos',
        url: 'someotherfarm.farmos.dev',
        entity: {
          type: 'asset--plant',
          attributes: {
            name: 'Another Plant Asset, also Spinach',
            status: 'active',
            geometry: '',
            surveystack_id: '12',
          },
          relationships: {
            plant_type: {
              data: [
                {
                  type: 'taxonomy_term--plant_type',
                  name: 'Spinach',
                },
              ],
            },
          },
        },
      },
    ];
    const res = getTerms(apiCompose);

    // two entries for both farms
    expect(res).toStrictEqual({
      'oursci.farmos.dev': [
        {
          endpoint: 'taxonomy_term',
          bundle: 'plant_type',
          name: 'Spinach',
        },
      ],
      'someotherfarm.farmos.dev': [
        {
          endpoint: 'taxonomy_term',
          bundle: 'plant_type',
          name: 'Spinach',
        },
      ],
    });
  });

  it('get-terms-ignore-single-domain', async () => {
    const apiCompose = [
      {
        type: 'farmos',
        url: 'oursci.farmos.dev',
        entity: {
          type: 'asset--plant',
          attributes: {
            name: 'Test plant Asset',
            status: 'active',
            geometry: '',
            surveystack_id: '12',
          },
          relationships: {
            plant_type: {
              data: [
                {
                  type: 'taxonomy_term--plant_type',
                  name: 'Spinach',
                },
              ],
            },
          },
        },
      },
      {
        type: 'farmos',
        url: 'someotherfarm.farmos.dev',
        entity: {
          type: 'asset--plant',
          attributes: {
            name: 'Another Plant Asset, also Spinach',
            status: 'active',
            geometry: '',
            surveystack_id: '12',
          },
          relationships: {
            plant_type: {
              data: [
                {
                  type: 'taxonomy_term--plant_type',
                  id: '6', // has id, should be ignored
                },
              ],
            },
          },
        },
      },
    ];
    const res = getTerms(apiCompose);

    // two entries for both farms
    expect(res).toStrictEqual({
      'oursci.farmos.dev': [
        {
          endpoint: 'taxonomy_term',
          bundle: 'plant_type',
          name: 'Spinach',
        },
      ],
      'someotherfarm.farmos.dev': [], // empty array
    });
  });

  it('substitute-relationships', () => {
    const terms = [
      {
        endpoint: 'taxonomy_term',
        bundle: 'plant_type',
        name: 'spinach',
        id: '0548b26f-effa-43b4-be41-fb5f443cd119',
      },
    ];

    const apiCompose = {
      type: 'farmos',
      url: 'someotherfarm.farmos.dev',
      entity: {
        type: 'asset--plant',
        attributes: {
          name: 'Another Plant Asset, also Spinach',
          status: 'active',
          geometry: '',
          surveystack_id: '12',
        },
        relationships: {
          plant_type: {
            data: [
              {
                type: 'taxonomy_term--plant_type',
                name: 'Spinach',
              },
            ],
          },
        },
      },
    };

    substitue(apiCompose.entity, terms);
    expect(apiCompose).toStrictEqual({
      type: 'farmos',
      url: 'someotherfarm.farmos.dev',
      entity: {
        type: 'asset--plant',
        attributes: {
          name: 'Another Plant Asset, also Spinach',
          status: 'active',
          geometry: '',
          surveystack_id: '12',
        },
        relationships: {
          plant_type: {
            data: [
              {
                type: 'taxonomy_term--plant_type',
                id: '0548b26f-effa-43b4-be41-fb5f443cd119',
              },
            ],
          },
        },
      },
    });
  });
});
