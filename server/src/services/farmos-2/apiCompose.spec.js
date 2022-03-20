import { createGroup, createReq, createRes, createUser, deleteMemberships, setRole } from '../../testUtils';
import {
    mapFarmOSInstanceToUser,
    mapFarmOSInstanceToGroupAdmin,
    unmapFarmOSInstance,
    listFarmOSInstancesForUser
} from './manage';


const init = async () => {
    const group = await createGroup();
    const user1 = await group.createUserMember();
    const user2 = await group.createUserMember();
    const admin1 = await group.createAdminMember();

    return {
        group,
        user1,
        user2,
        admin1,
    };
};

import { hasPermission } from "./apiCompose"

describe('farmos2-api-compose', () => {
    it.only('has-permission', async () => {
        const { group, user1, user2, admin1 } = await init();
        const instanceName = 'test.surveystack.io';
        await mapFarmOSInstanceToUser(user1.user._id, instanceName, true);
        await mapFarmOSInstanceToGroupAdmin(admin1.user._id, group._id, instanceName);

        expect(await hasPermission(user1.user._id, instanceName)).toBe(true);
        expect(await hasPermission(user2.user._id, instanceName)).toBe(false);
        expect(await hasPermission(admin1.user._id, instanceName)).toBe(true);

        await deleteMemberships(group._id, admin1.user._id);

        expect(await hasPermission(admin1.user._id, instanceName)).toBe(false);

        const mapResult = await mapFarmOSInstanceToUser(user2.user._id, instanceName, false);

        /**
         * user2 is not admin, so does not have permission
         */
        expect(await hasPermission(user2.user._id, instanceName)).toBe(false);

        const instances = await listFarmOSInstancesForUser(user2.user._id);
        expect(instances.length).toBe(1);

        await unmapFarmOSInstance(mapResult._id + '');
        expect(await hasPermission(user2.user._id, instanceName)).toBe(false);

        const instancesAfter = await listFarmOSInstancesForUser(user2.user._id);
        expect(instancesAfter.length).toBe(0);
    });
});