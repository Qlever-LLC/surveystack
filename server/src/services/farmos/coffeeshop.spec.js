import {
  addGroupToCoffeeShop,
  isCoffeeShopEnabled,
  removeGroupFromCoffeeShop,
  validateGroup,
} from './coffeeshop';
import { createGroup } from '../../testUtils';

const init = async () => {
  const group = await createGroup();
  const user1 = await group.createUserMember();
  const admin1 = await group.createAdminMember();

  return {
    group,
    user1,
    admin1,
  };
};

describe('coffeeShop', () => {
  it('validateGroup', async () => {
    await expect(validateGroup('100')).rejects.toThrow();

    await expect(validateGroup('5ea44b4ad9e86600011dc895')).rejects.toThrow(
      'group not found: 5ea44b4ad9e86600011dc895'
    );

    const { group } = await init();

    const res = await validateGroup(group._id);
    expect(res._id).toEqual(group._id);
  });

  it('validateAdd', async () => {
    const { group } = await init();

    const insertResult = await addGroupToCoffeeShop(group._id + '');
    expect(insertResult?.acknowledged).toBe(true);

    await expect(addGroupToCoffeeShop(group._id + '')).rejects.toThrow(
      'group already added to coffeeshop'
    );
  });

  it('validateRemove', async () => {
    const { group } = await init();

    await expect(removeGroupFromCoffeeShop(group._id + '')).rejects.toThrow(
      `group has coffeeshop disabled: ${group._id}`
    );

    const insertResult = await addGroupToCoffeeShop(group._id + '');
    expect(insertResult?.acknowledged).toBe(true);

    const deleteResult = await removeGroupFromCoffeeShop(group._id + '');
    expect(deleteResult?.acknowledged).toBe(true);
  });

  it('validateIsEnabled', async () => {
    const { group } = await init();

    const en = await isCoffeeShopEnabled(group._id);
    expect(en).toEqual(false);

    await addGroupToCoffeeShop(group._id + '');

    const res = await isCoffeeShopEnabled(group._id);
    expect(res).toEqual(true);
  });
});
