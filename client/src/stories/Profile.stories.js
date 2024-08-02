import TableGroup from '../components/integrations/FarmOSGroupSettings.vue';
import UpdatedTable from '../components/integrations/FarmOSGroupTable.vue';

export default {
  title: 'FarmOS',
  component: TableGroup,
  UpdatedTable,
  argTypes: {},
};

const TemplateGroup = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { TableGroup },
  template: '<table-group v-bind="$props" />',
  methods: {},
});

const TemplateRow = (args, { argTypes }) => ({
  props: Object.keys(argTypes),
  components: { UpdatedTable },
  template: '<updated-table v-bind="$props" />',
  methods: {},
});

export const FarmOSManage = TemplateGroup.bind({});
FarmOSManage.args = {
  superAdmin: true,
  plans: [
    { _id: '63f5dd174936e6412427e84f', planName: 'planA', planUrl: 'planA.net' },
    { _id: '6261b0b5546b3d004efdc779', planName: 'farmos-surveystack', planUrl: 'farmos2.net' },
    { _id: '62611531b6fc36004cedca83', planName: 'farmos-surveystack', planUrl: 'farmos.net' },
    { _id: '6261b09a546b3d004efdc778', planName: 'farmos-surveystack-2', planUrl: 'farmos.net' },
    { _id: '6261153fb6fc36004cedca84', planName: 'farmos-regendigital', planUrl: 'regen-digital.farm' },
  ],
  groupInfos: {
    _id: '63f5dcc14936e6412427e84e',
    groupId: '63e252f5826a396d74d6d537',
    planIds: ['63f5dd174936e6412427e84f'],
    groupHasFarmOSAccess: true,
    allowSubgroupsToJoinCoffeeShop: false,
    allowSubgroupAdminsToCreateFarmOSInstances: false,
    name: 'Group A',
    seats: { current: 2, max: 20 },
    groupHasCoffeeShopAccess: false,
    isDomainRoot: true,
    members: [
      {
        user: '63e2523d826a396d74d6d536',
        group: '63e252f5826a396d74d6d537',
        admin: true,
        path: '/group-a/',
        email: 'admin@our-sci.net',
        name: 'Admin',
        connectedFarms: [
          {
            instanceName: 'farm.admin.net',
            owner: true,
            _id: '64906f1a082b6b5af4777021',
            skip: false,
            groups: [
              { groupId: '63e252f5826a396d74d6d537', name: 'Group A', path: '/group-a/', breadcrumb: 'Group A' },
              {
                groupId: '649d4638447692370c226937',
                name: 'Group AA',
                path: '/group-a/group-aa/',
                breadcrumb: 'Group A > Group AA',
              },
            ],
          },
        ],
        breadcrumb: 'Group A',
        groups: [{ id: '63e252f5826a396d74d6d537', breadcrumb: 'Group A', path: '/group-a/' }],
      },
      {
        user: '63e24b3e826a396d74d6d530',
        group: '63e252f5826a396d74d6d537',
        admin: false,
        path: '/group-a/',
        email: 'super@our-sci.net',
        name: 'Super Admin',
        connectedFarms: [
          { instanceName: 'farm.super.net', owner: true, _id: '6584219918db91876dfb0def', skip: true, groups: [] },
          { instanceName: 'farm2.super.net', owner: true, _id: '658421a318db91876dfb0df0', skip: true, groups: [] },
        ],
        breadcrumb: 'Group A',
        groups: [
          { id: '63e252f5826a396d74d6d537', breadcrumb: 'Group A', path: '/group-a/' },
          { id: '649d4638447692370c226937', breadcrumb: 'Group A > Group AA', path: '/group-a/group-aa/' },
          {
            id: '649d4640447692370c226939',
            breadcrumb: 'Group A > Group AA > Group AAA (sub-sub for A)',
            path: '/group-a/group-aa/group-aaa/',
          },
        ],
      },
      {
        user: '63e251d1826a396d74d6d535',
        group: '63e252f5826a396d74d6d537',
        admin: false,
        path: '/group-a/',
        email: 'user@our-sci.net',
        name: 'User',
        connectedFarms: [
          { instanceName: 'farm.user.net', owner: true, _id: '64906a8c082b6b5af477701e', skip: true, groups: [] },
          {
            instanceName: 'farm2.user.net',
            owner: true,
            _id: '65832cca0033b371f724fec2',
            skip: false,
            groups: [
              { groupId: '63e252f5826a396d74d6d537', name: 'Group A', path: '/group-a/', breadcrumb: 'Group A' },
            ],
          },
        ],
        breadcrumb: 'Group A',
        groups: [{ id: '63e252f5826a396d74d6d537', breadcrumb: 'Group A', path: '/group-a/' }],
      },
    ],
    unassignedInstances: [],
    domainGroups: [
      { _id: '63e252f5826a396d74d6d537', name: 'Group A', slug: 'group-a', dir: '/', path: '/group-a/' },
      {
        _id: '649d4638447692370c226937',
        name: 'Group AA',
        slug: 'group-aa',
        dir: '/group-a/',
        path: '/group-a/group-aa/',
      },
      {
        _id: '649d4640447692370c226939',
        name: 'Group AAA (sub-sub for A)',
        slug: 'group-aaa',
        dir: '/group-a/group-aa/',
        path: '/group-a/group-aa/group-aaa/',
      },
    ],
  },
};

export const UpdatedFarmOSTable = TemplateRow.bind({});
UpdatedFarmOSTable.args = {
  members: [
    {
      user: '6304b1d70480f6bfd746326e',
      group: '62cff5ed51b9ae0001b007e5',
      admin: true,
      path: '/nexus/ch/',
      email: 'adminch@our-sci.net',
      name: 'adminch',
      connectedFarms: [],
      breadcrumb: 'nexus > ch',
      groups: [
        {
          id: '62cff5ed51b9ae0001b007e5',
          breadcrumb: 'nexus > ch',
          path: '/nexus/ch/',
        },
      ],
    },
    {
      user: '62cff62dc97982f88a07c608',
      group: '62cff5ed51b9ae0001b007e5',
      admin: true,
      path: '/nexus/ch/',
      email: 'jada.bonilla@surveystack.io',
      name: 'Jada Bonilla',
      connectedFarms: [
        {
          instanceName: 'sunandsoil.farmos.net',
          owner: true,
          _id: '6304e52cc0601f45ac83999c',
          skip: false,
          groups: [
            {
              groupId: '62cff5ed51b9ae0001b007e5',
              name: 'ch',
              path: '/nexus/ch/',
              breadcrumb: 'nexus > ch',
            },
          ],
        },
        {
          instanceName: 'lochwoodfarms.farmos.net',
          owner: true,
          _id: '6304e536c0601f45ac83999d',
          skip: true,
          groups: [],
        },
      ],
      breadcrumb: 'nexus > ch',
      groups: [
        {
          id: '62cff5ed51b9ae0001b007e5',
          breadcrumb: 'nexus > ch',
          path: '/nexus/ch/',
        },
      ],
    },
    {
      user: '5e95c2b319af91107cea476d',
      group: '5e96ff72e7e9e4000122ded9',
      admin: true,
      path: '/nexus/',
      email: 'manuel@our-sci.net',
      name: 'Manuel',
      connectedFarms: [
        {
          instanceName: 'natickfarm.farmos.net',
          owner: true,
          _id: '62a7547c9e353bd9eea6001b',
          skip: true,
          groups: [
            {
              groupId: '608d88171c6a18000147f341',
              name: 'France',
              path: '/bionutrient/labs/france/',
            },
            {
              groupId: '608d88171c6a18000147f3411',
              name: 'France 2',
              path: '/bionutrient/labs/france/',
            },
            {
              groupId: '608d88171c6a18000147f3412',
              name: 'France 3',
              path: '/bionutrient/labs/france/',
            },
            {
              groupId: '608d88171c6a18000147f3431',
              name: 'France 23',
              path: '/bionutrient/labs/france/',
            },
            {
              groupId: '608d88171c6a18000147f3414',
              name: 'France 4',
              path: '/bionutrient/labs/france/',
            },
            {
              groupId: '608d88171c6a18000147f3415',
              name: 'France 5',
              path: '/bionutrient/labs/france/',
            },
            {
              groupId: '608d88171c6a18000147f3416',
              name: 'France 6',
              path: '/bionutrient/labs/france/',
            },
            {
              groupId: '608d88171c6a18000147f3417',
              name: 'France 7',
              path: '/bionutrient/labs/france/',
            },
            {
              groupId: '608d88171c6a18000147f3419',
              name: 'France 8',
              path: '/bionutrient/labs/france/',
            },
            {
              groupId: '608d88171c6a18000147f34110',
              name: 'France 9',
              path: '/bionutrient/labs/france/',
            },
            {
              groupId: '608d88171c6a18000147f32241',
              name: 'France 10',
              path: '/bionutrient/labs/france/',
            },
            {
              groupId: '608d88171c6a18000147f33341',
              name: 'France 11',
              path: '/bionutrient/labs/france/',
            },
            {
              groupId: '608d88171c6a1800014744f341',
              name: 'France 12',
              path: '/bionutrient/labs/france/',
            },
            {
              groupId: '608d88171c6a18000147f35541',
              name: 'France 13',
              path: '/bionutrient/labs/france/',
            },
            {
              groupId: '608d88171c6a18000147f666341',
              name: 'France 14',
              path: '/bionutrient/labs/france/',
            },
            {
              groupId: '608d88171c6a18000147f37741',
              name: 'France 15',
              path: '/bionutrient/labs/france/',
            },
            {
              groupId: '608d88171c6a18000147f38841',
              name: 'France 16',
              path: '/bionutrient/labs/france/',
            },
          ],
        },
        {
          instanceName: 'coffeeshop.farmos.dev',
          owner: false,
          _id: '62cc2881cdc2758b86324255',
          skip: true,
          groups: [],
        },
        {
          instanceName: 'loptsonfarms.farmos.net',
          owner: false,
          _id: '62d2b19a640bf18860ff16b6',
          skip: false,
          groups: [
            {
              groupId: '5e96ff72e7e9e4000122ded9',
              name: 'nexus',
              path: '/nexus/',
              breadcrumb: 'nexus',
            },
          ],
        },
        {
          instanceName: 'surveystack-test.farmos.net',
          owner: true,
          _id: '62d2b60131ed08d4ce0f3b38',
          skip: true,
          groups: [],
        },
        {
          instanceName: 'osuharec.farmos.net',
          owner: false,
          _id: '62d2c395ee6868182dbd724d',
          skip: false,
          groups: [
            {
              groupId: '5e96ff72e7e9e4000122ded9',
              name: 'nexus',
              path: '/nexus/',
              breadcrumb: 'nexus',
            },
          ],
        },
        {
          instanceName: 'surveystack-test-01.farmos.net',
          owner: true,
          _id: '6304f947705de597c38ecb34',
          skip: false,
          groups: [
            {
              groupId: '62cff5ed51b9ae0001b007e5',
              name: 'ch',
              path: '/nexus/ch/',
              breadcrumb: 'nexus > ch',
            },
          ],
        },
        {
          instanceName: '8993.regen-digital.farm',
          owner: true,
          _id: '632883ca59ff4e078c690722',
          skip: false,
          groups: [
            {
              groupId: '5e96ff72e7e9e4000122ded9',
              name: 'nexus',
              path: '/nexus/',
              breadcrumb: 'nexus',
            },
          ],
        },
        {
          instanceName: '8994.regen-digital.farm',
          owner: true,
          _id: '6328845e0634bb095febeb70',
          skip: false,
          groups: [
            {
              groupId: '5e96ff72e7e9e4000122ded9',
              name: 'nexus',
              path: '/nexus/',
              breadcrumb: 'nexus',
            },
          ],
        },
        {
          instanceName: 'gladeroadgrowing.farmos.net',
          owner: true,
          _id: '63443039b4dfe5a21c958deb',
          skip: false,
          groups: [
            {
              groupId: '6169977cced6700001a0406e',
              name: 'ANEI',
              path: '/anei/',
            },
            {
              groupId: '62cff5ed51b9ae0001b007e5',
              name: 'ch',
              path: '/nexus/ch/',
              breadcrumb: 'nexus > ch',
            },
            {
              groupId: '5e96ff72e7e9e4000122ded9',
              name: 'nexus',
              path: '/nexus/',
              breadcrumb: 'nexus',
            },
          ],
        },
      ],
      breadcrumb: 'nexus',
      groups: [
        {
          id: '5e96ff72e7e9e4000122ded9',
          breadcrumb: 'nexus',
          path: '/nexus/',
        },
        {
          id: '62cff5ed51b9ae0001b007e5',
          breadcrumb: 'nexus > ch',
          path: '/nexus/ch/',
        },
        {
          id: '62cff64651b9ae0001b007e7',
          breadcrumb: 'nexus > ch > baden',
          path: '/nexus/ch/baden/',
        },
        {
          id: '62cff68e51b9ae0001b007e9',
          breadcrumb: 'nexus > deu',
          path: '/nexus/deu/',
        },
      ],
    },
    {
      user: '5ea453793978b95a0fcfd698',
      group: '62cff5ed51b9ae0001b007e5',
      admin: true,
      path: '/nexus/ch/',
      email: 'admin@our-sci.net',
      name: 'Our Sci Admin',
      connectedFarms: [],
      breadcrumb: 'nexus > ch',
      groups: [
        {
          id: '62cff5ed51b9ae0001b007e5',
          breadcrumb: 'nexus > ch',
          path: '/nexus/ch/',
        },
      ],
    },
    {
      user: '62cff59a5d5e7aac2920ad04',
      group: '5e96ff72e7e9e4000122ded9',
      admin: false,
      path: '/nexus/',
      email: 'adrianna.robertson@surveystack.io',
      name: 'Adrianna Robertson',
      connectedFarms: [],
      breadcrumb: 'nexus',
      groups: [
        {
          id: '5e96ff72e7e9e4000122ded9',
          breadcrumb: 'nexus',
          path: '/nexus/',
        },
      ],
    },
    {
      user: '62cff59aca4ace5a971933a8',
      group: '5e96ff72e7e9e4000122ded9',
      admin: false,
      path: '/nexus/',
      email: 'alexis.rodriguez@surveystack.io',
      name: 'Alexis Rodriguez',
      connectedFarms: [],
      breadcrumb: 'nexus',
      groups: [
        {
          id: '5e96ff72e7e9e4000122ded9',
          breadcrumb: 'nexus',
          path: '/nexus/',
        },
      ],
    },
    {
      user: '62cff6310d3f4a4c4a68aba2',
      group: '62cff5ed51b9ae0001b007e5',
      admin: false,
      path: '/nexus/ch/',
      email: 'arely.aguirre@surveystack.io',
      name: 'Arely Aguirre',
      connectedFarms: [],
      breadcrumb: 'nexus > ch',
      groups: [
        {
          id: '62cff5ed51b9ae0001b007e5',
          breadcrumb: 'nexus > ch',
          path: '/nexus/ch/',
        },
      ],
    },
    {
      user: '62cff66fa8d07cfe89b07887',
      group: '62cff64651b9ae0001b007e7',
      admin: false,
      path: '/nexus/ch/baden/',
      email: 'beckham.kennedy@surveystack.io',
      name: 'Beckham Kennedy',
      connectedFarms: [],
      breadcrumb: 'nexus > ch > baden',
      groups: [
        {
          id: '62cff64651b9ae0001b007e7',
          breadcrumb: 'nexus > ch > baden',
          path: '/nexus/ch/baden/',
        },
      ],
    },
    {
      user: '62cff66e386bbd004e3d6477',
      group: '62cff64651b9ae0001b007e7',
      admin: false,
      path: '/nexus/ch/baden/',
      email: 'chloe.wilson@surveystack.io',
      name: 'Chloe Wilson',
      connectedFarms: [],
      breadcrumb: 'nexus > ch > baden',
      groups: [
        {
          id: '62cff64651b9ae0001b007e7',
          breadcrumb: 'nexus > ch > baden',
          path: '/nexus/ch/baden/',
        },
      ],
    },
    {
      user: '62cff66dc53d517c3a50fec1',
      group: '62cff64651b9ae0001b007e7',
      admin: false,
      path: '/nexus/ch/baden/',
      email: 'clinton.pineda@surveystack.io',
      name: 'Clinton Pineda',
      connectedFarms: [],
      breadcrumb: 'nexus > ch > baden',
      groups: [
        {
          id: '62cff64651b9ae0001b007e7',
          breadcrumb: 'nexus > ch > baden',
          path: '/nexus/ch/baden/',
        },
      ],
    },
    {
      user: '62cff66c643bd955b19d04f9',
      group: '62cff64651b9ae0001b007e7',
      admin: false,
      path: '/nexus/ch/baden/',
      email: 'deangelo.bass@surveystack.io',
      name: 'Deangelo Bass',
      connectedFarms: [],
      breadcrumb: 'nexus > ch > baden',
      groups: [
        {
          id: '62cff64651b9ae0001b007e7',
          breadcrumb: 'nexus > ch > baden',
          path: '/nexus/ch/baden/',
        },
      ],
    },
    {
      user: '62cff66b6cf821c79a8866e7',
      group: '62cff64651b9ae0001b007e7',
      admin: false,
      path: '/nexus/ch/baden/',
      email: 'demetrius.atkinson@surveystack.io',
      name: 'Demetrius Atkinson',
      connectedFarms: [],
      breadcrumb: 'nexus > ch > baden',
      groups: [
        {
          id: '62cff64651b9ae0001b007e7',
          breadcrumb: 'nexus > ch > baden',
          path: '/nexus/ch/baden/',
        },
      ],
    },
    {
      user: '62cff630991902dd824b5f18',
      group: '62cff5ed51b9ae0001b007e5',
      admin: false,
      path: '/nexus/ch/',
      email: 'deon.melendez@surveystack.io',
      name: 'Deon Melendez',
      connectedFarms: [],
      breadcrumb: 'nexus > ch',
      groups: [
        {
          id: '62cff5ed51b9ae0001b007e5',
          breadcrumb: 'nexus > ch',
          path: '/nexus/ch/',
        },
      ],
    },
    {
      user: '62cff66ec19c685dbc024414',
      group: '62cff64651b9ae0001b007e7',
      admin: false,
      path: '/nexus/ch/baden/',
      email: 'elise.collier@surveystack.io',
      name: 'Elise Collier',
      connectedFarms: [],
      breadcrumb: 'nexus > ch > baden',
      groups: [
        {
          id: '62cff64651b9ae0001b007e7',
          breadcrumb: 'nexus > ch > baden',
          path: '/nexus/ch/baden/',
        },
      ],
    },
    {
      user: '62cff6bc1bd1b5b8880e7a71',
      group: '62cff68e51b9ae0001b007e9',
      admin: false,
      path: '/nexus/deu/',
      email: 'genevieve.levine@surveystack.io',
      name: 'Genevieve Levine',
      connectedFarms: [],
      breadcrumb: 'nexus > deu',
      groups: [
        {
          id: '62cff68e51b9ae0001b007e9',
          breadcrumb: 'nexus > deu',
          path: '/nexus/deu/',
        },
      ],
    },
    {
      user: '62cff66cf255b089e41293dc',
      group: '62cff64651b9ae0001b007e7',
      admin: false,
      path: '/nexus/ch/baden/',
      email: 'harley.pearson@surveystack.io',
      name: 'Harley Pearson',
      connectedFarms: [],
      breadcrumb: 'nexus > ch > baden',
      groups: [
        {
          id: '62cff64651b9ae0001b007e7',
          breadcrumb: 'nexus > ch > baden',
          path: '/nexus/ch/baden/',
        },
      ],
    },
    {
      user: '62cff6bb305a025e7325f7fc',
      group: '62cff68e51b9ae0001b007e9',
      admin: false,
      path: '/nexus/deu/',
      email: 'isaiah.lynch@surveystack.io',
      name: 'Isaiah Lynch',
      connectedFarms: [],
      breadcrumb: 'nexus > deu',
      groups: [
        {
          id: '62cff68e51b9ae0001b007e9',
          breadcrumb: 'nexus > deu',
          path: '/nexus/deu/',
        },
      ],
    },
    {
      user: '62cff6bae4923861d11b7f6c',
      group: '62cff68e51b9ae0001b007e9',
      admin: false,
      path: '/nexus/deu/',
      email: 'jadiel.flores@surveystack.io',
      name: 'Jadiel Flores',
      connectedFarms: [],
      breadcrumb: 'nexus > deu',
      groups: [
        {
          id: '62cff68e51b9ae0001b007e9',
          breadcrumb: 'nexus > deu',
          path: '/nexus/deu/',
        },
      ],
    },
    {
      user: '62cff66df30f3689f1c4cee7',
      group: '62cff64651b9ae0001b007e7',
      admin: false,
      path: '/nexus/ch/baden/',
      email: 'jaelyn.patterson@surveystack.io',
      name: 'Jaelyn Patterson',
      connectedFarms: [],
      breadcrumb: 'nexus > ch > baden',
      groups: [
        {
          id: '62cff64651b9ae0001b007e7',
          breadcrumb: 'nexus > ch > baden',
          path: '/nexus/ch/baden/',
        },
      ],
    },
    {
      user: '62cff62e8941bd75553838d7',
      group: '62cff5ed51b9ae0001b007e5',
      admin: false,
      path: '/nexus/ch/',
      email: 'jakobe.russo@surveystack.io',
      name: 'Jakobe Russo',
      connectedFarms: [
        {
          instanceName: '2625.regen-digital.farm',
          owner: true,
          _id: '6304e541c0601f45ac83999e',
          skip: true,
          groups: [],
        },
        {
          instanceName: 'wattbrosfarms.farmos.net',
          owner: true,
          _id: '6304e9fc965b4d5d7e8940c9',
          skip: true,
          groups: [],
        },
        {
          instanceName: 'hancockars.farmos.net',
          owner: true,
          _id: '6304ea67965b4d5d7e8940cc',
          skip: true,
          groups: [],
        },
      ],
      breadcrumb: 'nexus > ch',
      groups: [
        {
          id: '62cff5ed51b9ae0001b007e5',
          breadcrumb: 'nexus > ch',
          path: '/nexus/ch/',
        },
      ],
    },
    {
      user: '62cff6b957afc4aff067e359',
      group: '62cff68e51b9ae0001b007e9',
      admin: false,
      path: '/nexus/deu/',
      email: 'jonathon.holt@surveystack.io',
      name: 'Jonathon Holt',
      connectedFarms: [],
      breadcrumb: 'nexus > deu',
      groups: [
        {
          id: '62cff68e51b9ae0001b007e9',
          breadcrumb: 'nexus > deu',
          path: '/nexus/deu/',
        },
      ],
    },
    {
      user: '62cff6bb508982f61a41aea9',
      group: '62cff68e51b9ae0001b007e9',
      admin: false,
      path: '/nexus/deu/',
      email: 'leandro.ibarra@surveystack.io',
      name: 'Leandro Ibarra',
      connectedFarms: [],
      breadcrumb: 'nexus > deu',
      groups: [
        {
          id: '62cff68e51b9ae0001b007e9',
          breadcrumb: 'nexus > deu',
          path: '/nexus/deu/',
        },
      ],
    },
    {
      user: '62cff66f1c247092a22a91a1',
      group: '62cff64651b9ae0001b007e7',
      admin: false,
      path: '/nexus/ch/baden/',
      email: 'lorena.tate@surveystack.io',
      name: 'Lorena Tate',
      connectedFarms: [],
      breadcrumb: 'nexus > ch > baden',
      groups: [
        {
          id: '62cff64651b9ae0001b007e7',
          breadcrumb: 'nexus > ch > baden',
          path: '/nexus/ch/baden/',
        },
      ],
    },
    {
      user: '62cff599f5a9786d6f0a0072',
      group: '5e96ff72e7e9e4000122ded9',
      admin: false,
      path: '/nexus/',
      email: 'lucia.anthony@surveystack.io',
      name: 'Lucia Anthony',
      connectedFarms: [
        {
          instanceName: 'laurashomegarden.farmos.net',
          owner: true,
          _id: '62d2c75fee6868182dbd7255',
          skip: false,
          groups: [
            {
              groupId: '5e96ff72e7e9e4000122ded9',
              name: 'nexus',
              path: '/nexus/',
              breadcrumb: 'nexus',
            },
          ],
        },
      ],
      breadcrumb: 'nexus',
      groups: [
        {
          id: '5e96ff72e7e9e4000122ded9',
          breadcrumb: 'nexus',
          path: '/nexus/',
        },
      ],
    },
    {
      user: '62cff6b8f8e99c1d7f979df2',
      group: '62cff68e51b9ae0001b007e9',
      admin: false,
      path: '/nexus/deu/',
      email: 'madelyn.christensen@surveystack.io',
      name: 'Madelyn Christensen',
      connectedFarms: [],
      breadcrumb: 'nexus > deu',
      groups: [
        {
          id: '62cff68e51b9ae0001b007e9',
          breadcrumb: 'nexus > deu',
          path: '/nexus/deu/',
        },
      ],
    },
    {
      user: '62cff66b131cea07c05148a6',
      group: '62cff64651b9ae0001b007e7',
      admin: false,
      path: '/nexus/ch/baden/',
      email: 'mohamed.chan@surveystack.io',
      name: 'Mohamed Chan',
      connectedFarms: [],
      breadcrumb: 'nexus > ch > baden',
      groups: [
        {
          id: '62cff64651b9ae0001b007e7',
          breadcrumb: 'nexus > ch > baden',
          path: '/nexus/ch/baden/',
        },
      ],
    },
    {
      user: '62cff6b95c6a0d469faf41df',
      group: '62cff68e51b9ae0001b007e9',
      admin: false,
      path: '/nexus/deu/',
      email: 'morgan.johnson@surveystack.io',
      name: 'Morgan Johnson',
      connectedFarms: [],
      breadcrumb: 'nexus > deu',
      groups: [
        {
          id: '62cff68e51b9ae0001b007e9',
          breadcrumb: 'nexus > deu',
          path: '/nexus/deu/',
        },
      ],
    },
    {
      user: '62cff630444194a40972e359',
      group: '62cff5ed51b9ae0001b007e5',
      admin: false,
      path: '/nexus/ch/',
      email: 'presley.petersen@surveystack.io',
      name: 'Presley Petersen',
      connectedFarms: [],
      breadcrumb: 'nexus > ch',
      groups: [
        {
          id: '62cff5ed51b9ae0001b007e5',
          breadcrumb: 'nexus > ch',
          path: '/nexus/ch/',
        },
      ],
    },
    {
      user: '62cff53b3f968ea6c73d1415',
      group: '5e96ff72e7e9e4000122ded9',
      admin: false,
      path: '/nexus/',
      email: 'ryleigh.boyd@surveystack.io',
      name: 'Ryleigh Boyd',
      connectedFarms: [
        {
          instanceName: 'surveystack-test.farmos.net',
          owner: true,
          _id: '62cff6d7034994455d67b857',
          skip: true,
          groups: [],
        },
        {
          instanceName: 'ferrylanefarm.farmos.net',
          owner: true,
          _id: '62cff6e8034994455d67b858',
          skip: true,
          groups: [],
        },
        {
          instanceName: 'saladdaysfarm.farmos.net',
          owner: false,
          _id: '62cff8f6034994455d67b85c',
          skip: false,
          groups: [
            {
              groupId: '5e96ff72e7e9e4000122ded9',
              name: 'nexus',
              path: '/nexus/',
              breadcrumb: 'nexus',
            },
          ],
        },
        {
          instanceName: 'drymillfarm.farmos.net',
          owner: true,
          _id: '62d2ac990054b1541a9a3a0d',
          skip: false,
          groups: [
            {
              groupId: '5e96ff72e7e9e4000122ded9',
              name: 'nexus',
              path: '/nexus/',
              breadcrumb: 'nexus',
            },
          ],
        },
        {
          instanceName: 'beechgrovefarm.farmos.net',
          owner: false,
          _id: '62d2aca00054b1541a9a3a0e',
          skip: true,
          groups: [
            {
              groupId: '608d87611c6a18000147f33c',
              name: 'Labs',
              path: '/bionutrient/labs/',
            },
          ],
        },
        {
          instanceName: 'osuharec.farmos.net',
          owner: true,
          _id: '62d2c2fcc0325f04307b2a94',
          skip: false,
          groups: [
            {
              groupId: '5e96ff72e7e9e4000122ded9',
              name: 'nexus',
              path: '/nexus/',
              breadcrumb: 'nexus',
            },
          ],
        },
      ],
      breadcrumb: 'nexus',
      groups: [
        {
          id: '5e96ff72e7e9e4000122ded9',
          breadcrumb: 'nexus',
          path: '/nexus/',
        },
      ],
    },
    {
      user: '62cff6bacacf4c86d6ab8475',
      group: '62cff68e51b9ae0001b007e9',
      admin: false,
      path: '/nexus/deu/',
      email: 'salvatore.montgomery@surveystack.io',
      name: 'Salvatore Montgomery',
      connectedFarms: [],
      breadcrumb: 'nexus > deu',
      groups: [
        {
          id: '62cff68e51b9ae0001b007e9',
          breadcrumb: 'nexus > deu',
          path: '/nexus/deu/',
        },
      ],
    },
    {
      user: '62cff6bc1c2c0e142cdfad06',
      group: '62cff68e51b9ae0001b007e9',
      admin: false,
      path: '/nexus/deu/',
      email: 'samir.spence@surveystack.io',
      name: 'Samir Spence',
      connectedFarms: [],
      breadcrumb: 'nexus > deu',
      groups: [
        {
          id: '62cff68e51b9ae0001b007e9',
          breadcrumb: 'nexus > deu',
          path: '/nexus/deu/',
        },
      ],
    },
    {
      user: '62cff62e46911633589f9e23',
      group: '62cff5ed51b9ae0001b007e5',
      admin: false,
      path: '/nexus/ch/',
      email: 'shelby.marsh@surveystack.io',
      name: 'Shelby Marsh',
      connectedFarms: [],
      breadcrumb: 'nexus > ch',
      groups: [
        {
          id: '62cff5ed51b9ae0001b007e5',
          breadcrumb: 'nexus > ch',
          path: '/nexus/ch/',
        },
      ],
    },
    {
      user: '62cff62fdd95c3b8bec215b7',
      group: '62cff5ed51b9ae0001b007e5',
      admin: false,
      path: '/nexus/ch/',
      email: 'valentino.mills@surveystack.io',
      name: 'Valentino Mills',
      connectedFarms: [],
      breadcrumb: 'nexus > ch',
      groups: [
        {
          id: '62cff5ed51b9ae0001b007e5',
          breadcrumb: 'nexus > ch',
          path: '/nexus/ch/',
        },
      ],
    },
    {
      user: '62cff62f3db5e657f1eb7a35',
      group: '62cff5ed51b9ae0001b007e5',
      admin: false,
      path: '/nexus/ch/',
      email: 'waylon.pollard@surveystack.io',
      name: 'Waylon Pollard',
      connectedFarms: [],
      breadcrumb: 'nexus > ch',
      groups: [
        {
          id: '62cff5ed51b9ae0001b007e5',
          breadcrumb: 'nexus > ch',
          path: '/nexus/ch/',
        },
      ],
    },
  ],
};
