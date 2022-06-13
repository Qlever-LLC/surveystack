<template>
  <FarmOSGroupSettings v-if="farmosEnabled" class="ma-16" @addGrpCoffeeShop="addGroupCoffeeShop"
    @allowSbGrpsJoinCoffeeShop="allowSubGroupsJoinCoffeeShop"
    @allowSbGrpsAdminsCreateFarmOSFarmsInSS="allowSubGroupsAdminsCreateFarmOSFarmsInSS" :groupInfos="groupInfos">
  </FarmOSGroupSettings>
  <v-container v-else>
    <v-row v-if="loading">
      <v-col>
        <v-progress-linear indeterminate class="mb-0" />
      </v-col>
    </v-row>
    <v-row v-else>
      <v-col lg="4">
        <v-card class="pa-8" v-if="superAdmin">
          <p>FarmOS Integrations are disabled for this group.</p>
          <v-btn color="primary" type="submit" @click="enable">Enable</v-btn>
        </v-card>
        <v-card class="pa-8" v-else>
          <p>{{ message }}</p>
          <v-btn color="primary" type="submit" href="mailto:info@our-sci.net" target="_blank">Contact Our-Sci</v-btn>
        </v-card>
      </v-col>
    </v-row>

  </v-container>

</template>

<script>
import api from '@/services/api.service';
import FarmOSGroupSettings from './../../components/integrations/FarmOSGroupSettings.vue';


export default {
  props: {
    id: String,
  },
  components: {
    FarmOSGroupSettings,
  },
  computed: {
    superAdmin() {
      return this.$store.getters['auth/isSuperAdmin'];
    }
  },
  data() {
    return {
      groupInfos: null,
      groupId: null,
      farmosEnabled: false,
      loading: true,
      message: "",
    }
  },
  async created() {
    // setup function
    // fetch group settings
    const { id: groupId } = this.$route.params;
    this.groupId = groupId;

    //TODO create route in API
    const addGroupCoffeeShop = async (booleanValue, groupId) => {
      // update via api
      const res = await api.post('/farmos/coffee-shop-access', { groupId: groupId, updateTo: booleanValue });
    };
    //TODO create route in API
    const allowSubGroupsJoinCoffeeShop = async (booleanValue) => {
      // update via api
      const res = await api.post('/farmos/subgrp-join-coffee-shop', { groupId: groupId, updateTo: booleanValue });
    };
    //TODO create route in API
    const allowSubGroupsAdminsCreateFarmOSFarmsInSS = async (booleanValue) => {
      // update via api
      const rest = await api.post('/farmos/subgrp-admins-create-farmos-instances', {
        groupId: groupId,
        updateTo: booleanValue,
      });
    };

    try {
      const { data: res } = await api.get(`/farmos/group-manage/${groupId}/domain`);
      console.log("res", res.data);
      if (res.domain) {
        if (res.isDomainRootInDescendants) {
          this.message = `At least one subgroup has the FarmOS integration enabled: ${res.domain.name}`
        } else {
          const { data: groupInfos } = await api.get(`/farmos/group-manage/${groupId}`);
          console.log("group settings", groupInfos);
          this.groupInfos = groupInfos.response;
          this.farmosEnabled = true;
        }
      } else {
        this.message = "Please contact Surveystack to enable FarmOS integration for your Group";
      }
      this.loading = false;
    } catch (error) {
      this.message = error.message;
      this.loading = false;
    }

    /*
    this.groupInfos.value.members.forEach((el) => {
      if (el.connectedFarms[0] == undefined) {
        el.connectedFarms.push({});
      }
    });
    this.groupInfos.value.nonMembers.forEach((el) => {
      // without this if-check, we have an infinite loop
      if (!el.connectedFarms) {
        el.connectedFarms = [];
        let memberships = [];
        memberships.push({ groupId: el.groupId, fgm_id: el.fgm_id, path: el.path });
        el.connectedFarms.push({ instanceName: el.instanceName, memberships: memberships });
        this.groupInfos.value.members.push(el);
      }
    });
    */
  },
  methods: {
    updateGroupConfig() { },
    unifomMembersInGroupInfos() { },
    addGroupCoffeeShop() { },
    allowSubGroupsJoinCoffeeShop() { },
    allowSubGroupsAdminsCreateFarmOSFarmsInSS() { },
    async enable() {
      const res = await api.post('/farmos/group-manage/enable', { groupId: this.groupId, enable: true });
      console.log("res", res.data);


      try {
        const res = await api.get('/farmos/group-manage/' + this.groupId);
        this.groupInfos.value = res.data;
      } catch (error) {
        console.log("error", error.status);
      }
    }
  }
};
</script>
