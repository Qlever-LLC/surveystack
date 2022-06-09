<template>
  <FarmOSGroupSettings
    @addGrpCoffeeShop="addGroupCoffeeShop"
    @allowSbGrpsJoinCoffeeShop="allowSubGroupsJoinCoffeeShop"
    @allowSbGrpsAdminsCreateFarmOSFarmsInSS="allowSubGroupsAdminsCreateFarmOSFarmsInSS"
    :groupInfos="unifomMembersInGroupInfos"
  ></FarmOSGroupSettings>
</template>

<script>
import api from '@/services/api.service';
import { ref, computed } from '@vue/composition-api';
import { FarmOSGroupSettings } from './../../components/integrations/FarmOSGroupSettings.vue';
export default {
  props: {
    groupId: String,
  },
  components: {
    FarmOSGroupSettings,
  },
  async setup(props) {
    // setup function
    // fetch group settings
    const groupInfos = ref([]);

    //TODO create route in API
    const addGroupCoffeeShop = async (booleanValue, groupId) => {
      // update via api
      const resp = await api.post('/farmos/coffee-shop-access', { groupId: groupId, updateTo: booleanValue });
    };
    //TODO create route in API
    const allowSubGroupsJoinCoffeeShop = async (booleanValue) => {
      // update via api
    };
    //TODO create route in API
    const allowSubGroupsAdminsCreateFarmOSFarmsInSS = async (booleanValue) => {
      // update via api
    };

    function fetchData() {
      const resp = await api.get('farmos/group-manage/' + groupId);
      groupInfos.value = resp.data;
    }

    onMounted(() => {
      fetchData();
    });

    function unifomMembersInGroupInfos() {
      groupInfos.value.members.forEach((el) => {
        if (el.connectedFarms[0] == undefined) {
          el.connectedFarms.push({});
        }
      });
      groupInfos.value.nonMembers.forEach((el) => {
        // without this if-check, we have an infinite loop
        if (!el.connectedFarms) {
          el.connectedFarms = [];
          let memberships = [];
          memberships.push({ groupId: el.groupId, fgm_id: el.fgm_id, path: el.path });
          el.connectedFarms.push({ instanceName: el.instanceName, memberships: memberships });
          groupInfos.value.members.push(el);
        }
      });
      return groupInfos.value;
    }

    return {
      groupInfos,
      updateGroupConfig,
      unifomMembersInGroupInfos,
    };
  },
};
</script>
