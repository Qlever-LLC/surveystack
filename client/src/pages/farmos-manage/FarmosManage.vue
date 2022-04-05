<template>
  <v-container>
    <v-alert v-if="success" class="mt-4" mode="fade" text type="success" @click="success = null">{{ success }}</v-alert>

    <v-tabs v-model="tab" background-color="transparent" color="basil" grow>
      <v-tab v-for="item in items" :key="item.name">{{ item.name }}</v-tab>
    </v-tabs>

    <v-tabs-items v-model="tab">
      <v-tab-item v-for="item in items" :key="item.name">
        <v-component
          @map-group="mapGroup"
          @unmap-group="unmapGroup"
          @map-user="mapUser"
          @unmap-user="unmapUser"
          :is="item.component"
          :groups="groups"
          :mappings="mappings"
          :users="users"
          :loading="loading"
        ></v-component>
      </v-tab-item>
    </v-tabs-items>

    <v-alert v-if="error" class="mt-4" mode="fade" text type="error">{{ error }}</v-alert>
  </v-container>
</template>

<script>
import api from '@/services/api.service';
import Aggregator from './Aggregator.vue';
import Groups from './Groups.vue';
import Users from './Users.vue';

export default {
  data() {
    return {
      mappings: null,
      groups: null,
      users: null,
      tab: null,
      success: null,
      error: null,
      loading: false,
      items: [
        {
          name: 'Aggregator',
          component: Aggregator,
        },
        {
          name: 'Groups',
          component: Groups,
        },
        {
          name: 'Users',
          component: Users,
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
      const { data: mappings } = await api.get('/farmos/all');
      const { data: groups } = await api.get('/groups?populate=0');
      const { data: users } = await api.get('/users');
      this.loading = false;
      this.mappings = mappings;
      this.groups = groups;
      this.users = users;

      console.dir(users);
    },
    async mapGroup(group, instanceName) {
      this.error = null;
      try {
        this.loading = true;

        this.selectedGroup = null;
        this.selectedInstance = null;

        await api.post('/farmos/group-map-instance', {
          group,
          instanceName,
        });
        await this.reload();
        this.success = 'Sucessfully mapped instance';
      } catch (error) {
        console.dir(error);
        if (error.response && error.response.data && error.response.data.message) {
          this.error = error.response.data.message;
        } else {
          this.error = error.message;
        }

        this.loading = false;
      }
    },
    async unmapGroup(group, instanceName) {
      this.error = null;
      try {
        this.loading = true;

        await api.post('/farmos/group-unmap-instance', {
          group,
          instanceName,
        });
        await this.reload();
        this.success = 'Sucessfully un-mapped instance';
      } catch (error) {
        console.dir(error);
        if (error.response && error.response.data) {
          this.error = error.response.data;
        } else {
          this.error = error.message;
        }
      }
    },
    async mapUser(user, instanceName, owner) {
      this.error = null;
      try {
        console.log('owner', owner);
        this.loading = true;
        await api.post('/farmos/user-map-instance', {
          user,
          instanceName,
          owner,
        });
        await this.reload();
        this.success = 'Sucessfully mapped instance';
      } catch (error) {
        if (error.response && error.response.data && error.response.data.message) {
          this.error = error.response.data.message;
        } else {
          this.error = error.message;
        }

        this.loading = false;
      }
    },
    async unmapUser(user, instanceName) {
      this.error = null;
      try {
        this.loading = true;

        await api.post('/farmos/user-unmap-instance', {
          user,
          instanceName,
        });
        await this.reload();
        this.success = 'Sucessfully un-mapped instance';
      } catch (error) {
        console.dir(error);
        if (error.response && error.response.data) {
          this.error = error.response.data;
        } else {
          this.error = error.message;
        }
      }
    },
  },
};
</script>
