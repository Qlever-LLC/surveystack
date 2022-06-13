import { createGroup } from '../testUtils';
import { getDescendantGroups } from './roles.service';

describe('rolesService', () => {
  it('test-descendants', async () => {
    const groupBionutrient = await createGroup({ name: 'Bionutrient' });
    const groupLabs = await groupBionutrient.createSubGroup({ name: 'Labs' });
    const groupMichigan = await groupLabs.createSubGroup({ name: 'Michigan' });
    const groupEurope = await groupLabs.createSubGroup({ name: 'Europe' });
    const groupCommunity = await groupLabs.createSubGroup({ name: 'Community' });
    const groupCommunityLab = await groupCommunity.createSubGroup({ name: 'Lab' });

    const a = await getDescendantGroups(groupBionutrient);
    // console.log(a);
    expect(a._id).not.toBeNaN();
    expect.objectContaining(a[0].meta);
    expect(a[0].name).toBe('Bionutrient');
    expect(a[0].slug).toBe('bionutrient');
    expect(a[0].dir).toBe('/');
    expect(a[0].path).toBe('/bionutrient/');
    expect.objectContaining(a[0].surveys);
    expect(a).toHaveLength(6);

    const b = await getDescendantGroups(groupBionutrient, {});
    // console.log(b);
    expect(b._id).not.toBeNaN();
    expect.objectContaining(b[0].meta);
    expect(b[0].name).toBe('Bionutrient');
    expect(b[0].slug).toBe('bionutrient');
    expect(b[0].dir).toBe('/');
    expect(b[0].path).toBe('/bionutrient/');
    expect.objectContaining(b[0].surveys);
    expect(b).toHaveLength(6);

    const c = await getDescendantGroups(groupBionutrient, { name: 1, dir: 1 });
    // console.log(c);
    expect(c._id).not.toBeNaN();
    expect(c[0].meta).toBeUndefined();
    expect(c[0].name).toBe('Bionutrient');
    expect(c[0].slug).toBeUndefined();
    expect(c[0].dir).toBe('/');
    expect(c[0].path).toBeUndefined();
    expect(c[0].surveys).toBeUndefined();
    expect(c).toHaveLength(6);
  });
});
