<template>
  <div v-if="farmosEnabled">
    <v-alert
      v-if="successMessage"
      class="mt-4"
      style="cursor: pointer"
      mode="fade"
      text
      type="success"
      @click="successMessage = null"
      >{{ successMessage }}</v-alert
    >
    <v-alert v-if="errorMessage" style="cursor: pointer" class="mt-4 cursor-pointer" mode="fade" text type="error">{{
      errorMessage
    }}</v-alert>

    <FarmOSCreateDialog
      v-model="showCreateDialog"
      v-if="showCreateDialog"
      @check-url="checkUrl"
      @create-instance="createInstance"
      :viewModel="createViewModel"
    />

    <FarmOSConnectDialog
      v-model="showConnectDialog"
      :farmInstances="farmInstances"
      :allowCreate="allowCreate"
      @connect="connectFarms"
      @create="createFarm"
    />

    <FarmOSGroupSettings
      class="ma-16"
      @addGrpCoffeeShop="enableCoffeeshop"
      @allowSbGrpsJoinCoffeeShop="allowSubGroupsJoinCoffeeShop"
      @allowSbGrpsAdminsCreateFarmOSFarms="allowSubGroupsAdminsCreateFarmOSFarms"
      @connect="connect"
      @disconnect="disconnectFarm"
      @plansChanged="plansChanged"
      @seatsChanged="seatsChanged"
      :plans="plans"
      :groupInfos="groupInfos"
      :superAdmin="superAdmin"
    >
    </FarmOSGroupSettings>
  </div>

  <v-container v-else>
    <v-row v-if="loading">
      <v-col>
        <v-progress-linear indeterminate class="mb-0" />
      </v-col>
    </v-row>
    <v-row v-else>
      <v-col lg="4" class="mx-auto">
        <v-card class="pa-8 text-center" v-if="superAdmin">
          <p>{{ message }}</p>
          <v-btn color="primary" type="submit" @click="enable" v-if="btnEnable">Enable</v-btn>
          <v-btn color="primary" type="submit" href="mailto:info@our-sci.net" target="_blank" v-else-if="btnContact">
            Contact Our-Sci</v-btn
          >
        </v-card>
        <v-card class="pa-8 text-center" v-else>
          <p>{{ message }}</p>
          <v-btn color="primary" type="submit" href="mailto:info@our-sci.net" target="_blank" v-if="btnContact"
            >Contact Our-Sci</v-btn
          >
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import _ from 'lodash';
import api from '@/services/api.service';
import FarmOSGroupSettings from './../../components/integrations/FarmOSGroupSettings.vue';
import FarmOSConnectDialog from './../../components/integrations/FarmOSConnectDialog.vue';
import FarmOSCreateDialog from './../../components/integrations/FarmOSCreateDialog.vue';

export default {
  props: {
    id: String,
  },
  components: {
    FarmOSGroupSettings,
    FarmOSConnectDialog,
    FarmOSCreateDialog,
  },
  computed: {
    superAdmin() {
      return this.$store.getters['auth/isSuperAdmin'];
    },
    allowCreate() {
      if (!this.groupInfos) {
        return false;
      }
      return this.groupInfos.isDomainRoot || this.groupInfos.allowSubgroupAdminsToCreateFarmOSInstances;
    },
  },
  data() {
    return {
      groupInfos: null,
      groupId: null,
      farmosEnabled: false,
      loading: true,
      message: '',
      btnEnable: false,
      btnContact: true,
      showConnectDialog: false,
      showCreateDialog: false,
      selectedUser: null,
      farmInstances: [],
      plans: [],
      createViewModel: {},
      successMessage: null,
      errorMessage: null,
    };
  },
  async created() {
    // setup function
    // fetch group settings
    await this.init();

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
    updateGroupConfig() {},
    unifomMembersInGroupInfos() {},
    async seatsChanged(seats) {
      try {
        await api.post(`/farmos/group-manage/${this.groupId}/seats`, { seats: seats });
        this.success('seats updated');
      } catch (error) {
        this.error(error.response.data.message + '');
      }
      this.init();
    },
    async allowSubGroupsJoinCoffeeShop(booleanValue) {
      try {
        await api.post(`/farmos/group-manage/${this.groupId}/subgroup-join-coffee-shop`, { updateTo: booleanValue });
      } catch (error) {
        this.error(error.response.data.message + '');
      }

      this.init();
    },
    async allowSubGroupsAdminsCreateFarmOSFarms(booleanValue) {
      try {
        await api.post(`/farmos/group-manage/${this.groupId}/subgroup-create-farmos-instances`, {
          updateTo: booleanValue,
        });
        this.success('updated');
      } catch (error) {
        this.error(error.response.data.message + '');
      }

      this.init();
    },
    async enableCoffeeshop(booleanValue) {
      try {
        await api.post(`/farmos/group-manage/${this.groupId}/enable-coffeeshop`, {
          updateTo: booleanValue,
        });
        this.success('updated');
      } catch (error) {
        this.error(error.response.data.message + '');
      }

      this.init();
    },
    async init() {
      const { id: groupId } = this.$route.params;
      this.groupId = groupId;

      try {
        const { data: res } = await api.get(`/farmos/group-manage/${groupId}/domain`);
        if (res.domain) {
          if (res.isDomainRootInDescendants) {
            this.message = `At least one subgroup has the FarmOS integration enabled: ${res.domain.name}`;
            this.btnContact = false;
          } else {
            const { data: groupInfos } = await api.get(`/farmos/group-manage/${groupId}`);
            if (this.superAdmin) {
              const { data: plans } = await api.get(`/farmos/plans`);
              this.plans = plans;
            } else {
              const { data: plans } = await api.get(`/farmos/group-manage/${groupId}/plans`);
              this.plans = plans;
            }
            console.log('group settings', groupInfos);
            groupInfos.response.members = _.sortBy(groupInfos.response.members, [
              (m) => !m.admin,
              (m) => m.name.toLowerCase(),
            ]);
            this.groupInfos = groupInfos.response;
            this.farmosEnabled = true;
          }
        } else {
          if (this.superAdmin) {
            this.message = 'FarmOS Integrations are disabled for this group.';
            this.btnEnable = true;
          } else {
            this.message = 'Please contact Surveystack to enable FarmOS integration for your Group';
            this.btnEnable = false;
          }
        }
        this.loading = false;
      } catch (error) {
        if (error.response.status === 401) {
          this.message =
            'FarmOS is not enabled for your group. Please contact support if you are interested in FarmOS integration.';
        } else {
          this.message = error.message + '.';
        }
        this.loading = false;
      }
    },
    connect(user) {
      this.selectedUser = user;
      this.showConnectDialog = true;

      this.farmInstances = _.uniq([
        ...user.connectedFarms.filter((f) => f.owner == true).flatMap((f) => f.instanceName),
        ...this.groupInfos.unassignedInstances.flatMap((f) => f.instanceName),
      ]).filter((f) => !user.connectedFarms.some((c) => c.instanceName == f && !c.skip));
    },
    async enable() {
      const res = await api.post('/farmos/group-manage/enable', { groupId: this.groupId, enable: true });
      console.log('res', res.data);
      try {
        const res = await api.get('/farmos/group-manage/' + this.groupId);
        this.groupInfos = res.data;
        await this.init();
      } catch (error) {
        this.error(error.status);
      }
    },
    async connectFarms(farms) {
      console.log('connecting farms', farms, this.selectedUser);

      this.loading = true;
      this.showConnectDialog = false;

      for (const farm of farms) {
        console.log('farm', farm, farms);
        try {
          const res = await api.post(`/farmos/group-manage/${this.groupId}/mapUser`, {
            userId: this.selectedUser.user,
            instanceName: farm,
          });
        } catch (error) {
          this.error(error + '');
        }
      }

      await this.init();
    },
    async disconnectFarm(userId, instanceName) {
      console.log('disconnecting', userId, instanceName);

      this.loading = true;

      try {
        const res = await api.post(`/farmos/group-manage/${this.groupId}/unmapUser`, {
          userId,
          instanceName,
        });
      } catch (error) {
        this.error(error + '');
      }

      await this.init();
    },
    async plansChanged(plans) {
      this.loading = true;
      const res = await api.post(`/farmos/group-manage/${this.groupId}/updatePlans`, { plans });
      await this.init();
    },
    async createFarm() {
      const { data: plans } = await api.get(`/farmos/group-manage/${this.groupId}/plans`);

      const users = this.groupInfos.members.map((m) => {
        return {
          id: m.user,
          email: m.email,
          name: m.name,
        };
      });

      let selectedPlan = '';
      if (plans && plans.length > 0) {
        selectedPlan = plans[0]._id;
      }

      this.createViewModel = {
        form: {
          groupId: this.groupId,
          instanceName: '',
          instanceNameValid: null,
          email: this.selectedUser.email,
          fullName: this.selectedUser.name,
          farmName: '',
          farmAddress: '',
          units: '',
          timezone: '',
          agree: false,
          owner: this.selectedUser.user,
          fields: [],
          plan: selectedPlan,
        },
        groups: null,
        plans: plans,
        users: users,
        count: 1,
      };

      this.showCreateDialog = true;
      this.showConnectDialog = false;
    },
    async checkUrl(viewModel) {
      console.log('calling checkurl in FarmOS.vue');
      const vm = this.createViewModel;
      vm.form = viewModel.form;
      vm.loading = true;

      console.log('plans', this.plans);
      const plan = this.plans.find((p) => p._id === vm.form.plan);
      const { planName, planUrl } = plan;
      if (!planUrl) {
        vm.loading = false;
        vm.count += 1; // invalidate cache

        this.error('unable to find plan url for ' + vm.form.plan);
        return;
      }

      if (!planName) {
        vm.loading = false;
        vm.count += 1; // invalidate cache
        this.error('unable to find plan name for ' + vm.form.plan);
        return;
      }

      const instanceName = viewModel.form.instanceName;
      const url = `${instanceName}.${planUrl}`;

      try {
        const r = await api.post(`/farmos/group-manage/${this.groupId}/check-url`, {
          instanceName,
          planId: plan._id,
          url,
        });

        if (r.data.status === 'free') {
          vm.form.instanceNameValid = true;
          console.log('instance name free');
        } else {
          vm.form.instanceNameValid = false;
          console.log('instance name taken');
        }
      } catch (error) {
        vm.form.instanceNameValid = false;
        this.error(error + '');
      }

      vm.loading = false;
      vm.count += 1; // invalidate cache
    },
    async createInstance(form) {
      const vm = this.createViewModel;
      vm.form = form;
      vm.loading = true;

      console.log(vm);

      const formated = {
        ...form,
      };

      const { planName, planUrl } = this.plans.find((p) => p._id === formated.plan);
      if (!planUrl) {
        vm.loading = false;
        this.error('unable to find plan url for ' + formated.plan);
        return;
      }

      if (!planName) {
        vm.loading = false;
        this.error('unable to find plan name for ' + formated.plan);
        return;
      }

      formated.url = `${form.instanceName}.${planUrl}`;
      formated.planName = planName;
      formated.planId = form.plan;
      delete formated.plan;
      delete formated.instanceName;
      delete formated.instanceNameValid;

      try {
        const r = await api.post(`/farmos/group-manage/${this.groupId}/create-instance`, formated);

        if (r.data && r.data.status === 'success') {
          this.success('Successfully created Instance');
        } else {
          if (r.data.errors) {
            this.error('error creating instance: ' + r.data.errors);
          } else if (r.data.message) {
            this.error('error creating instance: ' + r.data.message);
          }
        }
      } catch (e) {
        this.error('error creating instance: ' + e.message);
      }

      vm.loading = false;
      vm.count += 1; // invalidate cache

      this.showCreateDialog = false;
      await this.init();
    },
    success(msg) {
      this.successMessage = msg;
      this.errorMessage = null;
      window.scrollTo(0, 0);
    },
    error(msg) {
      this.errorMessage = msg;
      this.successMessage = null;
    },
  },
};
</script>
