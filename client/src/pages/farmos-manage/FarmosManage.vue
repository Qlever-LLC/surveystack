<template>
  <a-container class="bg-white">
    <a-alert
      v-if="successMessage"
      class="mt-4"
      mode="fade"
      variant="text"
      type="success"
      @click="successMessage = null"
      >{{ successMessage }}</a-alert
    >

    <a-alert v-if="errorMessage" class="mt-4" mode="fade" variant="text" type="error" @click="errorMessage = null">{{
      errorMessage
    }}</a-alert>

    <a-tabs v-model="tab" bg-color="transparent" color="basil" grow>
      <a-tab v-for="item in items" :key="item.name">{{ item.name }}</a-tab>
    </a-tabs>

    <a-window v-model="tab">
      <a-window-item v-for="item in items" :key="item.name">
        <component
          @map-group="mapGroup"
          @unmap-group="unmapGroup"
          @map-user="mapUser"
          @unmap-user="unmapUser"
          @unmap-farm="unmapFarm"
          :plans="plans"
          :is="item.component"
          :groups="groups"
          :mappings="mappings"
          :notes="notes"
          :users="users"
          :loading="loading"
          :viewModel="item.viewModel || {}"
          @check-url="checkUrl"
          @create-instance="createInstance"
          @create-plan="createPlan"
          @delete-plan="deletePlan"
          @addSuperAdminNote="addSuperAdminNote">
        </component>
      </a-window-item>
    </a-window>

    <a-alert v-if="errorMessage" class="mt-4" mode="fade" variant="text" type="error">{{ errorMessage }}</a-alert>
  </a-container>
</template>

<script>
import api from '@/services/api.service';
import Aggregator from './Aggregator.vue';
import Groups from './Groups.vue';
import Users from './Users.vue';
import FarmOSRegister from './FarmOSRegister.vue';
import Plans from './Plans.vue';
import { getCurrentDateAsString } from '@/utils/timestamp.js';

export default {
  data() {
    return {
      mappings: null,
      notes: null,
      groups: null,
      users: null,
      tab: null,
      timeoutID: null,
      successMessage: null,
      errorMessage: null,
      loading: false,
      plans: [],
      selectedGroup: null,
      selectedInstance: null,
      items: [
        {
          name: 'farmOS instance',
          id: 'aggregator',
          component: Aggregator,
        },
        {
          name: 'Groups',
          id: 'groups',
          component: Groups,
        },
        {
          name: 'Users',
          id: 'users',
          component: Users,
        },
        {
          name: 'Create Instance',
          id: 'create-instance',
          component: FarmOSRegister,
          viewModel: {
            form: {
              groupId: null,
              instanceName: '',
              instanceNameValid: null,
              email: '',
              fullName: '',
              farmName: '',
              farmAddress: '',
              units: '',
              timezone: '',
              agree: false,
              owner: null,
              fields: [],
              plan: null,
            },
            groups: [],
            plans: [],
            users: [],
            count: 1,
          },
        },
        {
          name: 'Create Plans',
          id: 'plans',
          component: Plans,
          viewModel: {
            plans: [],
            count: 1,
          },
        },
      ],
    };
  },
  async created() {
    await this.reload();
  },
  methods: {
    async reload() {
      this.loading = true;
      const { data: notes } = await api.get('/farmos/notes/all');
      const { data: mappings } = await api.get('/farmos/all');
      const { data: groups } = await api.get('/groups');
      const { data: users } = await api.get('/users');
      const { data: plans } = await api.get('/farmos/plans');

      console.log('mappings', mappings);

      this.loading = false;
      this.notes = notes;
      this.mappings = mappings;
      this.groups = groups;
      this.users = users;
      this.plans = plans;

      const registerVm = this.vmOf('create-instance');
      registerVm.groups = groups;
      registerVm.plans = plans;
      registerVm.users = users;

      const plansVm = this.vmOf('plans');
      plansVm.plans = plans;

      console.dir(users);
    },
    async mapGroup(group, instanceName) {
      try {
        this.loading = true;

        this.selectedGroup = null;
        this.selectedInstance = null;

        await api.post('/farmos/group-map-instance', {
          group,
          instanceName,
        });
        await this.reload();
        this.success('Sucessfully mapped instance');
      } catch (error) {
        console.dir(error);
        if (error.response && error.response.data && error.response.data.message) {
          this.error(error.response.data.message);
        } else {
          this.error(error.message);
        }

        this.loading = false;
      }
    },
    async unmapGroup(group, instanceName) {
      console.log('unmap group instanceName', instanceName);
      try {
        this.loading = true;

        await api.post('/farmos/group-unmap-instance', {
          group,
          instanceName,
        });
        await this.reload();
        this.success('Sucessfully un-mapped instance');
      } catch (error) {
        console.dir(error);
        if (error.response && error.response.data) {
          this.error(error.response.data);
        } else {
          this.error(error.message);
        }
      }
    },
    async mapUser(user, instanceName, owner) {
      try {
        console.log('owner', owner);
        this.loading = true;
        await api.post('/farmos/user-map-instance', {
          user,
          instanceName,
          owner,
        });
        await this.reload();
        this.success('Sucessfully mapped instance');
      } catch (error) {
        if (error.response && error.response.data && error.response.data.message) {
          this.error(error.response.data.message);
        } else {
          this.error(error.message);
        }

        this.loading = false;
      }
    },
    async unmapUser(user, instanceName) {
      try {
        this.loading = true;

        await api.post('/farmos/user-unmap-instance', {
          user,
          instanceName,
        });
        await this.reload();
        this.success('Sucessfully unmapped user');
      } catch (error) {
        console.dir(error);
        if (error.response && error.response.data) {
          this.error(error.response.data);
        } else {
          this.error(error.message);
        }
      }
    },
    async unmapFarm(instanceName) {
      try {
        this.loading = true;
        await api.post('/farmos/unmap-instance', {
          instanceName,
        });
        await this.reload();
        this.success('Sucessfully unmapped farm instance');
      } catch (error) {
        console.dir(error);
        if (error.response && error.response.data) {
          this.error(error.response.data);
        } else {
          this.error(error.message);
        }
      }
    },
    vmOf(componentId) {
      return this.items.find((item) => item.id === componentId).viewModel;
    },
    async checkUrl(viewModel) {
      const vm = this.vmOf('create-instance');
      vm.form = viewModel.form;

      vm.loading = true;

      const { planName, planUrl } = this.plans.find((p) => p._id === vm.form.plan);
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

      const url = `${viewModel.form.instanceName}.${planUrl}`;

      try {
        const r = await api.post('/farmos/check-url', {
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
        console.log(error);
      }

      vm.loading = false;
      vm.count += 1; // invalidate cache
    },
    async createInstance(form) {
      const vm = this.vmOf('create-instance');
      vm.form = form;
      vm.loading = true;

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
      delete formated.plan;
      delete formated.instanceName;
      delete formated.instanceNameValid;

      try {
        const r = await api.post('/farmos/create-instance', formated);

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
    },
    async createPlan(planName, planUrl) {
      const vm = this.vmOf('plans');
      vm.loading = true;
      try {
        const r = await api.post('/farmos/plans/create', {
          planName: planName,
          planUrl: planUrl,
        });

        const { data: plans } = await api.get('/farmos/plans');
        vm.plans = plans;
        this.plans = plans;

        if (r.data.status === 'success') {
          this.success('Sucessfully created new plan');
        } else {
          this.error('Error creating plan');
        }
      } catch (error) {
        this.error(error.message);
      }

      vm.loading = false;
      vm.count += 1;
    },
    async deletePlan(planId) {
      const vm = this.vmOf('plans');
      vm.loading = true;

      try {
        const r = await api.post('/farmos/plans/delete', {
          planId,
        });

        const { data: plans } = await api.get('/farmos/plans');
        vm.plans = plans;
        this.plans = plans;

        if (r.data.status === 'success') {
          this.success('Sucessfully deleted');
        } else {
          this.error('Error deleting plan');
        }
      } catch (error) {
        this.error(error.message);
      }

      vm.loading = false;
      vm.count += 1;
    },
    async addSuperAdminNote(arg) {
      const { updatedNote: note, selectedInstance: instanceName } = arg;
      try {
        const timestamp = getCurrentDateAsString();
        await api.post(`/farmos/group-manage/add-sa-notes`, {
          note,
          instanceName,
          timestamp,
        });
        this.success('Succefully added notes');
        //reload notes
        this.loading = true;
        const { data: notes } = await api.get('/farmos/notes/all');
        this.notes = notes;
      } catch (error) {
        if (error.response && error.response.data && error.response.data.message) {
          this.error(error.response.data.message);
        } else {
          this.error(error.message);
        }
      }
      this.loading = false;
    },
    success(msg) {
      if (this.timeoutID) {
        clearTimeout(this.timeoutID);
      }
      this.successMessage = msg;
      this.errorMessage = null;
      window.scrollTo(0, 0);
      this.timeoutID = setTimeout(() => {
        this.successMessage = null;
        this.timeoutID = null;
      }, 15000);
    },
    error(msg) {
      if (this.timeoutID) {
        clearTimeout(this.timeoutID);
      }
      this.errorMessage = msg;
      this.successMessage = null;
      window.scrollTo(0, 0);
      this.timeoutID = setTimeout(() => {
        this.errorMessage = null;
        this.timeoutID = null;
      }, 15000);
    },
  },
};
</script>
