import { cloneDeep, find, pick } from 'lodash';
import {
  createHyloGroup,
  MUTATION_CREATE_GROUP,
  updateHyloGroup,
  queryHyloUser,
  QUERY_PERSON_BY_EMAIL,
  MUTATION_UPDATE_GROUP,
  addMember,
  MUTATION_ADD_MEMBER,
  upsertHyloUser,
  syncUserWithHylo,
  syncGroupWithHylo,
  getHyloApiComposeOutputs,
  API_COMPOSE_TYPE_HYLO,
  HYLO_TYPE_SYNC_GROUP,
  handleSyncGroupOutput,
  handle,
} from './hylo.service';
import { createGroup, createUser } from '../testUtils';
import { db, COLL_GROUPS_HYLO_MAPPINGS } from '../db';

describe('hylo.service', () => {
  describe('queryHyloUser', () => {});

  describe('queryHyloUser', () => {
    it('send the expected request', async () => {
      const email = 'foo@bar.com';
      const person = {};
      const gqlRequest = jest.fn(() => ({ person }));
      await queryHyloUser({ email, gqlRequest });
      expect(gqlRequest).toHaveBeenCalledWith(QUERY_PERSON_BY_EMAIL, { email });
    });

    it('returns the person from the result', async () => {
      const email = 'foo@bar.com';
      const person = { name: 'foo' };
      const gqlRequest = jest.fn(() => ({ person }));
      const result = await queryHyloUser({ email, gqlRequest });
      expect(result).toMatchObject(person);
    });
  });

  describe('createHyloGroup', () => {
    let data, hyloUserId;
    beforeEach(() => {
      data = {
        slug: 'group-slug',
      };
      hyloUserId = 'user-id-foo';
    });

    it('sends the expected request', async () => {
      const gqlRequest = jest.fn(() => ({ group: {} }));
      await createHyloGroup({ data, hyloUserId, gqlRequest });
      expect(gqlRequest).toHaveBeenCalledWith(MUTATION_CREATE_GROUP, {
        data,
        asUserId: hyloUserId,
      });
    });

    it('returns the group from the result', async () => {
      const group = { name: 'foo-group' };
      const gqlRequest = jest.fn(() => ({ group }));
      const result = await createHyloGroup({ data, hyloUserId, gqlRequest });
      expect(result.group).toMatchObject(group);
    });

    it('adds postfix when the selected slug is already in use', async () => {
      const gqlRequest = jest
        .fn()
        .mockImplementationOnce(() => {
          throw {
            response: { errors: [{ message: 'A group with that URL slug already exists' }] },
          };
        })
        .mockImplementationOnce(() => ({ group: {} }));
      await createHyloGroup({ data, hyloUserId, gqlRequest });
      expect(gqlRequest).toHaveBeenCalledWith(MUTATION_CREATE_GROUP, {
        data,
        asUserId: hyloUserId,
      });
      expect(gqlRequest).toHaveBeenCalledWith(MUTATION_CREATE_GROUP, {
        data: {
          slug: expect.stringMatching(new RegExp(`${data.slug}-\\d+`)),
        },
        asUserId: hyloUserId,
      });
    });

    it('throws when it fails to find a free slug', async () => {
      const gqlRequest = jest.fn(() => {
        throw {
          response: { errors: [{ message: 'A group with that URL slug already exists' }] },
        };
      });
      await expect(createHyloGroup({ data, hyloUserId, gqlRequest })).rejects.toThrow(
        `Failed to find a free slug after 12 trials`
      );
    });

    it('throws when request fails', async () => {
      const gqlRequest = jest.fn(() => {
        throw new Error('foo');
      });
      await expect(createHyloGroup({ data, hyloUserId, gqlRequest })).rejects.toThrow(
        `Failed to create group`
      );
    });
  });

  describe('updateHyloGroup', () => {
    let data, hyloUserId, hyloGroupId;
    beforeEach(() => {
      data = {
        slug: 'group-slug',
      };
      hyloUserId = 'user-id-foo';
      hyloGroupId = 'group-id-foo';
    });

    it('sends the expected request', async () => {
      const gqlRequest = jest.fn(() => ({ group: {} }));
      await updateHyloGroup({ data, hyloUserId, gqlRequest, hyloGroupId });
      expect(gqlRequest).toHaveBeenCalledWith(MUTATION_UPDATE_GROUP, {
        id: hyloGroupId,
        changes: data,
        asUserId: hyloUserId,
      });
    });

    it('returns the group from the result', async () => {
      const group = { name: 'foo-group' };
      const gqlRequest = jest.fn(() => ({ group }));
      const result = await updateHyloGroup({ data, hyloUserId, hyloGroupId, gqlRequest });
      expect(result.group).toMatchObject(group);
    });
  });

  describe('addMember', () => {
    it('send the expected request', async () => {
      const hyloUserId = 'user-id-foo';
      const hyloGroupId = 'group-id-foo';
      const gqlRequest = jest.fn(() => ({}));
      await addMember({ hyloUserId, hyloGroupId, gqlRequest });
      expect(gqlRequest).toHaveBeenCalledWith(MUTATION_ADD_MEMBER, {
        hyloGroupId,
        hyloUserId,
      });
    });
  });

  describe('upsertHyloUser', () => {
    let options, hyloUser;
    beforeEach(() => {
      options = {
        email: 'foo@bar.com',
        name: 'Foo Bar',
        hyloGroupId: 'hylo-group-foo',
        createHyloUser: jest.fn(),
        addMember: jest.fn(),
        queryHyloUser: jest.fn(() => 45),
      };
      hyloUser = {
        id: 'hylo-user-id',
        ...pick(options, 'name', 'email'),
      };
    });

    it('checks if the user already exist', async () => {
      options.queryHyloUser.mockResolvedValue(hyloUser);
      await upsertHyloUser(options);
      expect(options.queryHyloUser).toHaveBeenCalledWith(
        expect.objectContaining(pick(options, 'email'))
      );
    });

    it('calls addMember if user already exists', async () => {
      options.queryHyloUser.mockResolvedValue(hyloUser);
      await upsertHyloUser(options);
      expect(options.addMember).toHaveBeenCalledWith(
        expect.objectContaining({
          hyloUserId: hyloUser.id,
          hyloGroupId: options.hyloGroupId,
        })
      );
    });

    it('calls createHyloUser if user does not exists', async () => {
      options.queryHyloUser.mockResolvedValue(null);
      options.createHyloUser.mockResolvedValue(hyloUser);
      await upsertHyloUser(options);
      expect(options.createHyloUser).toHaveBeenCalledWith(
        expect.objectContaining(pick(options, 'email', 'name', 'hyloGroupId'))
      );
    });

    it('throws if it failed to find or create the user', async () => {
      await expect(upsertHyloUser(options)).rejects.toThrow(
        "Hylo didn't return an ID for the user"
      );
    });

    it('returns the hyloUser', async () => {
      options.queryHyloUser.mockResolvedValue(hyloUser);
      expect(upsertHyloUser(options)).resolves.toMatchObject(hyloUser);
    });
  });

  describe('syncUserWithHylo', () => {
    it('calls upsertHyloUser', async () => {
      const user = await createUser();
      const upsertHyloUser = jest.fn();
      await syncUserWithHylo({ userId: user._id, upsertHyloUser });
      expect(upsertHyloUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: user.email, name: user.name })
      );
    });
  });

  describe('syncGroupWithHylo', () => {
    let options, group;
    beforeEach(() => {
      options = {
        data: {
          slug: 'group-slug',
        },
        hyloGroupId: 'group-id-foo',
        hyloUserId: 'group-user-foo',
        updateHyloGroup: jest.fn(),
        createHyloGroup: jest.fn(),
      };
      group = {
        id: 'new-group-id',
      };
    });

    it('calls updateHyloGroup when hyloGroupId is set', async () => {
      options.updateHyloGroup.mockResolvedValue({ group });
      await syncGroupWithHylo(options);
      expect(options.updateHyloGroup).toHaveBeenCalledWith(
        expect.objectContaining(pick(options, 'data', 'hyloUserId', 'hyloGroupId'))
      );
    });

    it('returns the updated group', async () => {
      options.updateHyloGroup.mockResolvedValue({ group });
      expect(syncGroupWithHylo(options)).resolves.toMatchObject(group);
    });

    it('calls createHyloGroup when hyloGroupId is NOT set', async () => {
      options.hyloGroupId = undefined;
      options.createHyloGroup.mockResolvedValue({ group });
      await syncGroupWithHylo(options);
      expect(options.createHyloGroup).toHaveBeenCalledWith(
        expect.objectContaining(pick(options, 'data', 'hyloUserId'))
      );
    });

    it('returns the updated group', async () => {
      options.updateHyloGroup.mockResolvedValue({ group });
      expect(syncGroupWithHylo(options)).resolves.toMatchObject(group);
    });
  });

  describe('getHyloApiComposeOutputs', () => {
    it('returns Hylo apiCompose outputs', () => {
      const output = testOutput({ slug: 'some-slug-foo' });
      const control = {
        name: 'number_1',
        label: 'Enter a number 1',
        type: 'number',
        options: {
          apiCompose: { enabled: true, code: 'let foo = "bar;' },
        },
        id: '62a1bd92aecffd000183c5e9',
        hint: '',
        value: null,
      };
      const survey = {
        revisions: [
          {
            version: 1,
            controls: [control],
          },
        ],
      };
      const submission = {
        meta: { survey: { version: 1 } },
        data: { number_1: { meta: { apiCompose: output } } },
      };
      expect(getHyloApiComposeOutputs({ submission, survey })).toMatchObject([output]);
    });
  });

  describe('handleSyncGroupOutput', () => {
    let options, hyloUser, hyloGroup, parentHyloGroup, extraModerator;
    beforeEach(async () => {
      extraModerator = {
        email: 'foo@bar.com',
        name: 'Foo Bar',
      };
      const output = testOutput({
        slug: 'test-group-foo',
        extraModerators: [
          {
            name: {
              value: extraModerator.name,
            },
            email: {
              value: extraModerator.email,
            },
          },
        ],
      });
      const group = await createGroup();
      const { user } = await group.createUserMember();
      hyloGroup = {
        id: 'hylo-id-from-prev-submission',
      };
      parentHyloGroup = {
        id: 'hylo-id-of-the-connected-surveystack-group',
      };
      hyloUser = {
        id: 'hylo-user-id',
      };
      options = {
        output,
        user,
        group: {
          id: group._id,
          path: group.path,
        },
        hyloGroupId: hyloGroup.id,
        syncUserWithHylo: jest.fn().mockResolvedValue(hyloUser),
        syncGroupWithHylo: jest.fn().mockResolvedValue(hyloGroup),
        addMember: jest.fn(),
        upsertHyloUser: jest.fn(),
        gqlRequest: jest.fn(),
        gqlRequestWithUrl: jest.fn(),
        gqlPostConfig: jest.fn(),
      };
      await db
        .collection(COLL_GROUPS_HYLO_MAPPINGS)
        .insertOne({ groupId: group._id, hyloGroupId: parentHyloGroup.id });
    });
    it('throws for invalid output', async () => {
      options.output.entity.type = 'not-farm';
      await expect(handleSyncGroupOutput(options)).rejects.toThrow(
        'entity.type: "entity.type" must be [farm]'
      );
    });
    it('calls syncUserWithHylo', async () => {
      await handleSyncGroupOutput(options);
      expect(options.syncUserWithHylo).toHaveBeenCalledWith(
        expect.objectContaining({ userId: options.user._id })
      );
    });
    describe('calls syncGroupWithHylo', () => {
      let entity;
      beforeEach(() => {
        entity = cloneDeep(options.output.entity);
        delete entity.geoShape;
        delete entity.extraModerators;
        entity.groupExtensions = entity.groupExtensions.map((e) => ({
          ...e,
          data: JSON.stringify(e.data),
        }));
      });
      it('all data is added', async () => {
        await handleSyncGroupOutput(options);
        expect(options.syncGroupWithHylo.mock.calls[0][0]).toMatchObject({
          data: entity,
          hyloUserId: hyloUser.id,
          hyloGroupId: hyloGroup.id,
        });
      });
      it('entity.parentIds is added', async () => {
        await handleSyncGroupOutput(options);
        expect(options.syncGroupWithHylo.mock.calls[0][0]).toMatchObject({
          data: { parentIds: [parentHyloGroup.id] },
        });
      });
      it('entity.parentIds is not added when there is no group integration', async () => {
        await db.collection(COLL_GROUPS_HYLO_MAPPINGS).deleteOne({ groupId: options.group.id });
        await handleSyncGroupOutput(options);
        expect(options.syncGroupWithHylo.mock.calls[0][0].data.parentIds).not.toBeDefined();
      });
      it('removes entity.geoShape', async () => {
        await handleSyncGroupOutput(options);
        expect(options.syncGroupWithHylo.mock.calls[0][0].data.geoShape).not.toBeDefined();
      });
    });
    it('calls addMember with the admin user', async () => {
      await handleSyncGroupOutput(options);
      expect(options.addMember).toHaveBeenCalledWith(
        expect.objectContaining({ hyloGroupId: hyloGroup.id, hyloUserId: hyloUser.id })
      );
    });
    it('calls addMember with the admin user', async () => {
      await handleSyncGroupOutput(options);
      expect(options.addMember).toHaveBeenCalledWith(
        expect.objectContaining({ hyloGroupId: hyloGroup.id, hyloUserId: hyloUser.id })
      );
    });
    it('calls upsertHyloUser with extraModerators', async () => {
      await handleSyncGroupOutput(options);
      expect(options.upsertHyloUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: extraModerator.email,
          name: extraModerator.name,
          hyloGroupId: hyloGroup.id,
        })
      );
    });
    it('adds hyloGroup ID to permanent results', async () => {
      const result = await handleSyncGroupOutput(options);
      expect(result).toMatchObject({
        permanent: { createdHyloGroup: { id: hyloGroup.id } },
      });
    });
  });

  describe('handle', () => {
    let options, hyloGroupId, output, result;
    beforeEach(async () => {
      output = {
        type: API_COMPOSE_TYPE_HYLO,
        hyloType: HYLO_TYPE_SYNC_GROUP,
        entity: {
          slug: 'slug-foo',
        },
      };
      result = {
        data: 'foo',
      };
      hyloGroupId = 'hylo-group-id-from-prev-submission';
      options = {
        submission: { meta: { group: { id: 'group-id-foo' } } },
        prevSubmission: {
          meta: {
            permanentResults: [
              {
                type: API_COMPOSE_TYPE_HYLO,
                hyloType: HYLO_TYPE_SYNC_GROUP,
                createdHyloGroup: {
                  id: hyloGroupId,
                },
              },
            ],
          },
        },
        survey: {},
        user: {
          email: 'aaa@bbb.com',
        },
        getHyloApiComposeOutputs: jest.fn().mockReturnValue([output]),
        handleSyncGroupOutput: jest.fn().mockResolvedValue(result),
      };
    });
    it('calls handleSyncGroupOutput', async () => {
      await handle(options);
      expect(options.handleSyncGroupOutput.mock.calls[0][0]).toMatchObject({
        output,
        user: options.user,
        group: options.submission.meta.group,
        hyloGroupId: find(options.prevSubmission?.meta?.permanentResults || [], {
          type: API_COMPOSE_TYPE_HYLO,
          hyloType: HYLO_TYPE_SYNC_GROUP,
        })?.createdHyloGroup.id,
      });
    });
  });
});

export const testOutput = (settings = {}) => {
  const { extraModerators, name, slug } = {
    ...{
      extraModerators: [
        {
          name: {
            value: 'Foo Bar',
          },
          email: {
            value: 'foo@gmail.com',
          },
        },
      ],
      name: 'Test Group 1',
      slug: 'test-group-1',
    },
    ...settings,
  };
  return {
    type: API_COMPOSE_TYPE_HYLO,
    hyloType: HYLO_TYPE_SYNC_GROUP,
    url: 'staging.hylo.com',
    entity: {
      accessibility: 1,
      description: 'Long long string of very important characters',
      name,
      slug,
      type: 'farm',
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
