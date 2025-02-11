import { createGroup } from '../testUtils';
import { getGroupAndDescendants } from './roles.service';

describe('rolesService', () => {
  it('test-descendants', async () => {
    const groupBionutrient = await createGroup({ name: 'Bionutrient' });
    const groupLabs = await groupBionutrient.createSubGroup({ name: 'Labs' });
    await groupLabs.createSubGroup({ name: 'Michigan' });
    await groupLabs.createSubGroup({ name: 'Europe' });
    const groupCommunity = await groupLabs.createSubGroup({ name: 'Community' });
    await groupCommunity.createSubGroup({ name: 'Lab' });

    const a = await getGroupAndDescendants(groupBionutrient);
    expect(a[0]._id).toBeDefined();
    expect(a[0].name).toBe('Bionutrient');
    expect(a[0].slug).toBe('bionutrient');
    expect(a[0].dir).toBe('/');
    expect(a[0].path).toBe('/bionutrient/');
    expect(a).toHaveLength(6);

    const b = await getGroupAndDescendants(groupBionutrient, {});
    expect(b[0]._id).toBeDefined();
    expect(b[0].name).toBe('Bionutrient');
    expect(b[0].slug).toBe('bionutrient');
    expect(b[0].dir).toBe('/');
    expect(b[0].path).toBe('/bionutrient/');
    expect(b).toHaveLength(6);

    const c = await getGroupAndDescendants(groupBionutrient, { name: 1, dir: 1 });
    expect(c[0]._id).toBeDefined();
    expect(c[0].meta).toBeUndefined();
    expect(c[0].name).toBe('Bionutrient');
    expect(c[0].slug).toBeUndefined();
    expect(c[0].dir).toBe('/');
    expect(c[0].path).toBeUndefined();
    expect(c[0].surveys).toBeUndefined();
    expect(c).toHaveLength(6);
  });
});
