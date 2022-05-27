import boom from '@hapi/boom';
import axios from 'axios';
import { ObjectId } from 'mongodb';
import querystring from 'querystring';

import * as utils from '../helpers/surveys';

import { COLL_GROUPS_HYLO_MAPPINGS, db } from '../db';
import { gql } from 'graphql-request';
import * as hyloUtils from './hylo/utils';
import Joi, { date } from 'joi';

const createLogger = () => {
  const logs = [];
  const log = (type, message, data) => {
    console.log(type, message, data);
    logs.push({ type, message, data, time: Date.now() });
  };
  return {
    log,
    success: (message, data) => log('success', message, data),
    error: (message, data) => {
      log('error', message, data);
      return new Error(message + JSON.stringify(data, null, 2));
    },
    warning: (message, data) => log('warning', message, data),
    info: (message, data) => log('info', message, data),
    getLogs: () => [...logs],
  };
};

const deps = { gqlRequest: hyloUtils.gqlRequest, gqlPostConfig: hyloUtils.gqlPostConfig };

const outputSchema = Joi.object({
  entity: Joi.object({
    name: Joi.string().required(),
    slug: Joi.string().required(),
    extraModerators: Joi.array().items(
      Joi.object({
        name: Joi.object({ value: Joi.string().required() }).required(),
        email: Joi.object({ value: Joi.string().required() }).required(),
      }).required()
    ),
  }).required(),
})
  .required()
  .options({ allowUnknown: true });

const createHyloUser = async (options) => {
  const { email, name, groupId, gqlPostConfig } = { ...deps, ...options };
  console.log('create hyloUser', { email, name, groupId });
  const r = await axios.post(
    `${process.env.HYLO_API_URL}/noo/user`,
    querystring.stringify({ email, name, groupId }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: (await gqlPostConfig()).headers.Authorization,
      },
    }
  );
  return r.data;
};

const queryHyloUser = async (options) => {
  const { email, gqlRequest } = { ...deps, ...options };
  console.log('queryHyloUser', email);
  return (
    await gqlRequest(
      gql`
        query ($id: ID, $email: String) {
          person(id: $id, email: $email) {
            id
            name
            hasRegistered
          }
        }
      `,
      { email }
    )
  ).person;
};

const FRAGMENT_GROUP_DETAILS = gql`
  fragment GroupDetails on Group {
    id
    name
    slug
    members {
      items {
        id
        name
        hasRegistered
      }
    }
  }
`;

const queryHyloGroup = async (options) => {
  const { slug, gqlRequest } = { ...deps, ...options };
  return gqlRequest(
    gql`
      query ($id: ID, $slug: String) {
        group(id: $id, slug: $slug) {
          ...GroupDetails
        }
      }
      ${FRAGMENT_GROUP_DETAILS}
    `,
    { slug }
  );
};

const createHyloGroup = async (options) => {
  const { data, hyloUserId, gqlRequest } = { ...deps, ...options };
  return gqlRequest(
    gql`
      mutation ($data: GroupInput, $asUserId: ID) {
        group: createGroup(data: $data, asUserId: $asUserId) {
          ...GroupDetails
        }
      }
      ${FRAGMENT_GROUP_DETAILS}
    `,
    {
      data,
      asUserId: hyloUserId,
    }
  );
};

const updateHyloGroup = async (options) => {
  const { data, hyloUserId, hyloGroupId, gqlRequest } = { ...deps, ...options };
  return gqlRequest(
    gql`
      mutation ($id: ID, $changes: GroupInput, $asUserId: ID) {
        group: updateGroup(id: $id, changes: $changes, asUserId: $asUserId) {
          ...GroupDetails
        }
      }
      ${FRAGMENT_GROUP_DETAILS}
    `,
    {
      id: hyloGroupId,
      changes: data,
      asUserId: hyloUserId,
    }
  );
};

const upsertHyloUser = async (options) => {
  const { email, name, groupId, logger } = { ...deps, ...options };
  logger.info(`Query Hylo user - email="${email}"`);
  let hyloUser = await queryHyloUser({ email, ...options });
  // TODO make sure the user is added to the group (if set)

  // if user already exists
  if (!hyloUser?.id) {
    logger.info(`Create Hylo user - email="${email}"`);
    hyloUser = await createHyloUser({
      email,
      name,
      groupId,
      ...options,
    });
  }

  if (!hyloUser?.id) {
    throw logger.error("Hylo didn't return an ID for the user", { hyloUser });
  }

  logger.success('Got Hylo user', hyloUser);
  return hyloUser;
};

const syncUserWithHylo = async (options) => {
  const { userId, logger } = { ...deps, ...options };
  const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
  if (!user) {
    throw logger.error(`Can't find SurveyStack user with id "${userId}"`);
  }
  return await upsertHyloUser({ email: user.email, ...options });
};

const syncGroupWithHylo = async (options) => {
  const { data, hyloUserId, gqlRequest, logger } = { ...deps, ...options };
  let group = null;
  try {
    logger.info(`Create Hylo group slug=${data.slug} hyloUserId=${hyloUserId}`, {
      data,
      hyloUserId,
    });
    group = (await createHyloGroup({ data, hyloUserId, gqlRequest })).group;
  } catch (e) {
    if (
      !e.response?.errors?.some((e) => e.message === 'A group with that URL slug already exists')
    ) {
      logger.info(`Group with slug ${data.slug} already exist. Try to update it...`);
    } else {
      logger.error('Failed to create group', e.response?.errors);
      throw e;
    }
  }
  if (!group?.id) {
    logger.info(`Query Hylo group slug=${data.slug}`);
    group = (await queryHyloGroup({ gqlRequest, slug: data.slug })).group;
    if (!group?.id) {
      throw logger.error(`Failed to create or find a Hylo group with slug "${data.slug}"`);
    }

    logger.info(`Update Hylo group slug=${data.slug}`, { data, hyloUserId, hyloGroupId: group.id });
    group = (await updateHyloGroup({ data, hyloUserId, hyloGroupId: group.id, gqlRequest })).group;
  }
  logger.info('Got Hylo group', group);
  return group;
};

// getToken().then((t) => console.log('Token', t));
// createHyloUser({ name: 'azazdeaz test 6', email: 'user6@azazdeaz.test' }).then((t) =>
//   console.log('NEW USER', t)
// );
// queryHyloUser('user3@azazdeaz.test').then((t) => console.log('USER', t));
// const group = createHyloGroup('azazdeaz-test-group-5', '36341').then((t) => {
//   console.log('NEW GROUP', JSON.stringify(t, null, 2));
//   return t;
// });
// queryHyloGroup('azazdeaz-test-group-2').then((t) => console.log('GROUP', t));
// updateHyloGroup('34844', '36341').then((t) => {
//   console.log('UPDAATED GROUP', JSON.stringify(t, null, 2));
//   return t;
// });

const getHyloApiComposeOutputs = ({ submission, survey }) => {
  const surveyVersion = submission.meta.survey.version;

  const { controls } = survey.revisions.find((revision) => revision.version === surveyVersion);
  const positions = utils.getControlPositions(controls);

  return positions
    .map((position) => {
      const control = utils.getControl(controls, position);
      if (!control.options.apiCompose || !control.options.apiCompose.enabled) {
        return [];
      }

      const field = utils.getSubmissionField(submission, survey, position);

      const compose = [];

      if (field.meta.relevant === false) {
        return [];
      }

      if (!field.meta.apiCompose) {
        return [];
      }

      if (Array.isArray(field.meta.apiCompose)) {
        for (const c of field.meta.apiCompose) {
          compose.push(c);
        }
      } else if (typeof field.meta.apiCompose === 'object') {
        compose.push(field.meta.apiCompose);
      } else {
        return [];
      }

      const relevantApiCompose = compose.filter((c) => c.type === 'hylo');
      if (relevantApiCompose.length === 0) {
        return [];
      }

      return compose;
    })
    .flat();
};

export const handleSyncGroupOutput = async ({ output: _output, user, group, logger }) => {
  const { value: output, error } = outputSchema.validate(_output);
  if (error) {
    const errors = error.details.map((e) => `${e.path.join('.')}: ${e.message}`);
    console.log(error.details, _output);
    throw boom.badData(`error: ${errors.join(', ')}`);
  }
  logger.success('Output is valid', output);

  const {
    url,
    entity: { extraModerators, ...entity },
  } = output;
  const { name, slug } = entity;

  const href = url ? 'https://' + url : null;
  const gqlRequest = href ? hyloUtils.gqlRequestWithUrl(href) : hyloUtils.gqlRequest;
  const gqlPostConfig = href ? () => hyloUtils.gqlPostConfig(href) : hyloUtils.gqlPostConfig;
  const options = { gqlRequest, gqlPostConfig, logger };

  // Convert some fields to JSON to match the Hylo API
  entity.geoShape = JSON.stringify(entity.geoShape);
  entity.groupExtensions = entity.groupExtensions.map((e) => ({
    ...e,
    data: JSON.stringify(e.data),
  }));
  // TODO Hylo throws Invalid GeoJSON
  delete entity.geoShape;
  logger.warning('Remove data.geoShape - TODO Hylo throws Invalid GeoJSON');

  const groupMapping = await db
    .collection(COLL_GROUPS_HYLO_MAPPINGS)
    .findOne({ groupId: new ObjectId(group.id) });
  if (groupMapping) {
    entity.parentIds = [groupMapping.hyloGroupId];
    logger.success('Found Hylo group integration', groupMapping);
  } else {
    logger.warn("Didn't find Hylo group integration", groupMapping);
  }

  const hyloUser = await syncUserWithHylo({ userId: user._id, ...options });
  logger.info('Hylo user', hyloUser);
  const hyloGroup = await syncGroupWithHylo({
    data: entity,
    hyloUserId: hyloUser.id,
    ...options,
  });
  logger.info('Hylo group', hyloGroup);

  const extraModeratorUsers = [];
  for (const { email, name } of extraModerators) {
    logger.info(`Add extra moderator email=${email} name=${name}`);
    extraModeratorUsers.push(
      await upsertHyloUser({
        email: email.value,
        name: name.value,
        groupId: hyloGroup.id,
        ...options,
      })
    );
  }

  logger.info('extraModeratorUsers', extraModeratorUsers);

  return { hyloUser, hyloGroup, extraModeratorUsers };
};

export const handle = async ({ submission, survey, user }) => {
  const hyloCompose = getHyloApiComposeOutputs({ submission, survey });
  console.log('hyloCompose', hyloCompose);
  const results = [];
  const logger = createLogger();
  for (const output of hyloCompose) {
    if (output.hyloType === 'sync-group') {
      try {
        const result = await handleSyncGroupOutput({
          output,
          user,
          group: submission.meta.group,
          logger,
        });
        result.logs = logger.getLogs();
        results.push(result);
      } catch (e) {
        e.logs = logger.getLogs();
        throw e;
      }
    }
  }
  console.log('RESULTS', JSON.stringify(results, null, 2));

  // TODO does results have an expected format?
  return results;
};

export const testOutput = (settings = {}) => {
  const { extraModerators, name, slug } = {
    ...{
      extraModerators: [
        {
          name: {
            value: 'TestAz1',
          },
          email: {
            value: 'azazdeaz+1@gmail.com',
          },
        },
      ],
      name: 'Test Group 1',
      slug: 'test-group-1',
    },
    ...settings,
  };
  return {
    type: 'hylo',
    hyloType: 'sync-group',
    url: 'staging.hylo.com',
    entity: {
      accessibility: 1,
      description: 'Long long string of very important characters',
      name,
      slug,
      extraModerators,
      visibility: 2,
      location: '560 Little lake dr, washtenaw',
      geoShape: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-83.81905157566662, 42.27737447179118],
                  [-83.81108777364244, 42.277429030949605],
                  [-83.80934261949517, 42.27639239886244],
                  [-83.80926888058752, 42.275192066721104],
                  [-83.810374964202, 42.274810138063515],
                  [-83.81339825941488, 42.27442820709132],
                  [-83.81642155462777, 42.27350065080853],
                  [-83.81892867748724, 42.27330058785978],
                  [-83.81905157566662, 42.27737447179118],
                ],
              ],
            },
            properties: null,
            id: 'measureFeature0',
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-83.81165310526761, 42.273609775785616],
                  [-83.81145646818058, 42.27035413270508],
                  [-83.80971131403331, 42.27031775585479],
                  [-83.80976047330509, 42.270881594675274],
                  [-83.80929346022342, 42.27091797120016],
                  [-83.80934261949517, 42.273591588302565],
                  [-83.81165310526761, 42.273609775785616],
                ],
              ],
            },
            properties: null,
            id: 'measureFeature1',
          },
        ],
      },
      groupExtensions: [
        {
          type: 'farm-onboarding',
          data: {
            title: 'Farm Profile',
            status: true,
            immediate_data_source: 'surveystack',
            name: 'Greg Austic',
            role: 'farm_owner',
            organization: 'Austic Farm',
            organization_id: '52-34323',
            email: 'gbathree@gmail.com',
            phone: '9195451083',
            preferred: 'text',
            social: '@gregaustic',
            website: 'www.austicfarm.com',
            bio: 'what a great farm I have',
            location_country_code: 'US',
            location_address_line1: '560 Little lake dr',
            location_locality: 'ann arbor',
            location_postal_code: '48103',
            county: 'washtenaw',
            area: {
              value:
                'GEOMETRYCOLLECTION(POLYGON ((-83.81905157566662 42.27737447179118, -83.81108777364244 42.277429030949605, -83.80934261949517 42.27639239886244, -83.80926888058752 42.275192066721104, -83.810374964202 42.274810138063515, -83.81339825941488 42.27442820709132, -83.81642155462777 42.27350065080853, -83.81892867748724 42.27330058785978, -83.81905157566662 42.27737447179118)),POLYGON ((-83.81165310526761 42.273609775785616, -83.81145646818058 42.27035413270508, -83.80971131403331 42.27031775585479, -83.80976047330509 42.270881594675274, -83.80929346022342 42.27091797120016, -83.80934261949517 42.273591588302565, -83.81165310526761 42.273609775785616)))',
            },
            average_annual_rainfall: 38,
            average_annual_temperature: '10.01',
            climate_zone: 'Dfa',
            hardiness_zone: '6a',
            conditions_detail:
              '[{"month":"jan","temp_min":-6.627903064516127,"temp_max":-0.947216463709677,"temp_avg":-3.8951189892721034,"precip_min":0,"precip_max":0.443058064516129,"precip_avg":0.06198361921778216},{"month":"feb","temp_min":-6.916902654867255,"temp_max":0.03960317256637211,"temp_avg":-3.507859036289721,"precip_min":0,"precip_max":0.49847699115044225,"precip_avg":0.07513652841572901},{"month":"mar","temp_min":-1.5285074193548382,"temp_max":7.038188060483869,"temp_avg":2.549389038684812,"precip_min":0,"precip_max":0.7025721774193552,"precip_avg":0.0899592746279649},{"month":"apr","temp_min":3.387420325,"temp_max":12.962210166666669,"temp_avg":8.155355775183766,"precip_min":0,"precip_max":1.027449166666667,"precip_avg":0.1143192365167629},{"month":"may","temp_min":9.716226429184552,"temp_max":19.898412703862654,"temp_avg":14.995510868511966,"precip_min":0.04978540772532189,"precip_max":1.3886746781115882,"precip_avg":0.23161899011479886},{"month":"jun","temp_min":14.832333904761903,"temp_max":25.263380952380963,"temp_avg":20.409111479965457,"precip_min":0,"precip_max":1.767142857142857,"precip_avg":0.13159769846215136},{"month":"jul","temp_min":17.764009216589873,"temp_max":28.208986175115218,"temp_avg":23.149785171089828,"precip_min":0,"precip_max":1.1912700460829493,"precip_avg":0.09955944669126789},{"month":"aug","temp_min":17.157695852534573,"temp_max":27.954147465437785,"temp_avg":22.504655127884238,"precip_min":0,"precip_max":1.2276497695852533,"precip_avg":0.09157066109852037},{"month":"sep","temp_min":13.700524952380947,"temp_max":25.301571428571414,"temp_avg":19.077882969142895,"precip_min":0,"precip_max":1.0814285714285714,"precip_avg":0.09726190494876058},{"month":"oct","temp_min":7.542537691244239,"temp_max":17.062074101382496,"temp_avg":12.20748688667668,"precip_min":0,"precip_max":0.9216589861751147,"precip_avg":0.11055798783823956},{"month":"nov","temp_min":0.8710036047619047,"temp_max":8.33538457142857,"temp_avg":4.515329527010629,"precip_min":0,"precip_max":0.5476190476190476,"precip_avg":0.07829365103195113},{"month":"dec","temp_min":-2.996926059174311,"temp_max":3.0353678899082586,"temp_avg":-0.07511096194131538,"precip_min":0,"precip_max":0.5200403669724771,"precip_avg":0.07052752339916266}]',
            interest: ['benchmarking', 'communication', 'connect with people I like'],
            types: ['research_farm', 'wholesale_farm'],
            products_categories: ['aquaculture', 'berries', 'dairy'],
            products_animal: ['chickens', 'sheep', 'bees'],
            products_detail: ['almond', 'amaranth', 'buckeyes'],
            products_value_added: ['animal hide', 'baked goods'],
            units: 'metric',
            area_total_hectares: 37,
            land_type_detail:
              '{"type":"matrix","data":[{"berries":{"value":[".3"]},"dairy":{"value":[".7"]},"aquaculture":{"value":[".1"]}}]}',
            land_other: ['native_land_title', 'share_farm'],
            land_other_detail:
              '{"type":"matrix","data":[{"share_farm":{"value":[".3"]},"native_title":{"value":[".9"]}}]}',
            animals_total: 55,
            animals_detail:
              '{"type":"matrix","data":[{"type":{"value":"cattle"},"total":{"value":12}},{"type":{"value":"bees"},"total":{"value":2333}}]}',
            equity_practices: ['diversity support'],
            indigenous_territory: ['ojibwe'],
            farm_leadership_experience: 4,
            certifications_current: 'yes',
            certifications_future: 'yes',
            certifications_current_detail: ['american_wool', 'animal_welfare'],
            certifications_future_detail: ['a new certification'],
            management_plans_current: 'yes',
            management_plans_future: 'yes',
            management_plans_current_detail: ['irrigation_management'],
            management_plans_future_detail: ['another new one', 'habitat_plan'],
            records_system: ['paper', 'software'],
            records_software: ['another', 'farmos', 'pasture_map'],
            goal_1: 'profitability',
            goal_2: 'soil_fertility',
            goal_3: 'soil_structure',
            motivations: ['education', 'family_farm', 'paid_work', 'other'],
            area_community: {
              value:
                'GEOMETRYCOLLECTION(POLYGON ((-83.86712440107665 41.846853108770574, -83.83993486101184 41.86393963824102, -83.81423939637338 41.88225898798581, -83.7901394154211 41.901737827893214, -83.76773002976955 41.92229825423874, -83.74709967902605 41.94385811336198, -83.72832978175985 41.96633134182639, -83.71149441418032 41.989628321468615, -83.69666001779196 42.013656247693376, -83.6838851371801 42.03831950933002, -83.67322018896223 42.06352007833644, -83.66470726281668 42.089157907617874, -83.65837995537365 42.115131335216745, -83.65426323762502 42.141337493130465, -83.65237335637497 42.16767271902373, -83.6527177701214 42.194032969118496, -83.65529511962058 42.2203142305726, -83.66009523325154 42.24641293169026, -83.66709916715874 42.27222634834982, -83.67627928001484 42.29765300508046, -83.68759934210837 42.32259306927287, -83.7010146783259 42.34694873706633, -83.7164723444643 42.370624609516796, -83.73391133617721 42.393528057716054, -83.75326282973147 42.41556957560044, -83.77445045362289 42.436663119257446, -83.79739058997966 42.45672643161137, -83.82199270456395 42.47568135144164, -83.84815970406912 42.49345410576029, -83.87578831930269 42.509975584649794, -83.90476951274263 42.52518159773311, -83.93498890885873 42.53901311152214, -83.96632724550038 42.55141646695941, -83.99866084457004 42.56234357653943, -84.03186210012396 42.57175210046259, -84.0657999819747 42.579605601342195, -84.10034055280732 42.585873677050074, -84.13534749676884 42.59053207134937, -84.17068265744463 42.59356276202627, -84.20620658309853 42.59495402629241, -84.24177907702538 42.594700483291035, -84.27725975084316 42.59280311359802, -84.31250857854188 42.5892692556686, -84.34738644910227 42.58411257923845, -84.38175571550342 42.57735303574759, -84.41548073795268 42.56901678591203, -84.44842841919392 42.55913610463108, -84.48046872978165 42.547749263475055, -84.5114752212478 42.53490039106242, -84.54132552513612 42.52063931169579, -84.56990183593439 42.50502136269225, -84.5970913759992 42.48810719090747, -84.62278684063766 42.46996252902133, -84.64688682158994 42.45065795222018, -84.66929620724149 42.43026861598284, -84.68992655798499 42.40887397574548, -84.70869645525119 42.38655748929665, -84.72553182283073 42.36340630282348, -84.74036621921908 42.33951092160521, -84.75314109983096 42.31496486642283, -84.7638060480488 42.289864316826254, -84.77231897419438 42.2643077424724, -84.77864628163739 42.23839552381696, -84.78276299938604 42.212229563510675, -84.78465288063607 42.185912889914135, -84.78430846688966 42.15954925420843, -84.78173111739046 42.13324272263182, -84.7769310037595 42.107097265426944, -84.7699270698523 42.08121634412643, -84.76074695699621 42.05570249884423, -84.74942689490267 42.030656937271544, -84.73601155868514 42.006179127099614, -84.72055389254675 41.982366393607464, -84.70311490083384 41.95931352415843, -84.68376340727957 41.93711238134665, -84.66257578338815 41.91585152652229, -84.63963564703138 41.89561585540076, -84.61503353244709 41.8764862474288, -84.58886653294194 41.85853923053736, -84.56123791770835 41.84184666285634, -84.53225672426841 41.8264754329042, -84.50203732815231 41.81248717969035, -84.47069899151067 41.799938034085585, -84.43836539244101 41.78887838272283, -84.4051641368871 41.77935265558892, -84.37122625503633 41.77139913835893, -84.33668568420372 41.76504981040654, -84.3016787402422 41.76033020930191, -84.26634357956641 41.75725932247653, -84.2308196539125 41.75584950660158, -84.19524715998567 41.75610643508767, -84.15976648616788 41.758029073970704, -84.12451765846916 41.76160968630728, -84.08963978790877 41.76683386505616, -84.05527052150762 41.77368059428025, -84.02154549905836 41.78212233835865, -83.98859781781712 41.792125158758694, -83.95655750722939 41.803648857779876, -83.92555101576323 41.816647148548185, -83.89570071187494 41.83106785041244, -83.86712440107665 41.846853108770574)))',
            },
            organizational_id: '52-34323',
            flexible: {
              hylo: {
                purpose: 'Plant one million oak trees',
                at_a_glance: ['Yay', 'farm', 'life', 'woo'],
                opening_hours: 'M-F 4-8pm',
                open_to_public: true,
                public_offerings: ['events', 'farmstand'],
              },
            },
          },
        },
      ],
      moderatorDescriptor: 'Farmer',
      settings: {
        locationDisplayPrecision: 'precise',
        publicMemberDirectory: false,
      },
      typeDescriptor: 'farm',
    },
    errors: [],
  };
};

const op = testOutput({
  extraModerators: [
    {
      name: {
        value: 'TestAz1',
      },
      email: {
        value: 'azazdeaz+1@gmail.com',
      },
    },
  ],
  name: 'Test Group 2',
  slug: 'test-group-2',
});

// new Promise((r) => setTimeout(r, 3000))
//   .then(() => db.collection('users').findOne({ email: 'azazdeaz@gmail.com' }))
//   .then((user) => handleSyncGroupOutput({ output: op, user }))
//   .then((t) => {
//     console.log('Handled', JSON.stringify(t, null, 2));
//     return t;
//   });
