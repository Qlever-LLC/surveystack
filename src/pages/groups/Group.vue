<template>
  <v-container v-if="initialized && status.code === 200">
    <div class="d-flex justify-space-between align-center">
      <span v-if="entity.path">
        <router-link
          :to="`/g${entity.path}`"
          class="text-muted"
        >{{entity.path}}</router-link>
      </span>
      <v-btn
        class="ml-auto"
        :to="{name: 'groups-edit', params: {id: entity._id}}"
        text
      >
        <v-icon>mdi-pencil</v-icon>
        <span class="ml-2">Edit</span>
      </v-btn>
    </div>

    <h1>
      {{entity.name}}
    </h1>

    <v-row>
      <v-col
        cols="12"
        lg="6"
      >
        <app-group-user-list :entities="users" />
      </v-col>
      <v-col
        cols="12"
        lg="6"
      >
        <app-group-list
          :entities="subgroups"
          :path="subgroupPath"
          title="Subgroups"
        />
      </v-col>
    </v-row>

  </v-container>
  <v-container v-else-if="status.code === 404">
    <h1>Oh snap!</h1>
    <p>No group under <strong>{{$route.params.pathMatch}}</strong> was found :/ </p>

  </v-container>
</template>

<script>
import api from '@/services/api.service';
import appGroupList from '@/components/groups/GroupList.vue';
import appGroupUserList from '@/components/groups/GroupUserList.vue';


import { GROUP_PATH_DELIMITER } from '@/constants';

export default {
  name: 'Group',
  components: {
    appGroupList,
    appGroupUserList,
  },
  data() {
    return {
      initialized: false,
      status: {
        code: 200,
        message: '',
      },
      entity: {
        _id: '',
        name: '',
        slug: '',
        path: null,
      },
      users: [],
      subgroups: [],
    };
  },
  methods: {
    async getEntity(path) {
      this.initialized = false;
      try {
        const { data } = await api.get(`/groups/by-path/${path}`);
        this.entity = data;
        await this.getSubgroups();
        await this.getUsers();
      } catch (e) {
        this.status.code = e.response.status;
        this.status.message = e.response.data.message;
      }
    },
    async getSubgroups() {
      try {
        let childrenPath = `${this.entity.path}${this.entity.slug}${GROUP_PATH_DELIMITER}`;
        if (this.entity.path === null) {
          childrenPath = `${GROUP_PATH_DELIMITER}${this.entity.slug}${GROUP_PATH_DELIMITER}`;
        }

        const { data } = await api.get(`/groups?path=${childrenPath}`);
        this.subgroups = data;
      } catch (e) {
        this.status.code = e.response.status;
        this.status.message = e.response.data.message;
      }
    },
    async getUsers() {
      const { data } = await api.get(`/groups/${this.entity._id}/users`);
      this.users = data;
    },
  },
  computed: {
    subgroupPath() {
      if (!this.entity.path) {
        return `${GROUP_PATH_DELIMITER}${this.entity.slug}${GROUP_PATH_DELIMITER}`;
      }
      return `${this.entity.path}${this.entity.slug}${GROUP_PATH_DELIMITER}`;
    },
  },
  async beforeRouteUpdate(to, from, next) {
    const { pathMatch } = to.params;
    await this.getEntity(pathMatch);
    this.initialized = true;
    next();
  },
  async created() {
    const { pathMatch } = this.$route.params;
    await this.getEntity(pathMatch);
    this.initialized = true;
  },
};
</script>

<style scoped>
.placeholder {
  display: flex;
  margin-bottom: 3rem;
}
.placeholder > div {
  display: flex;
  flex: 1;
  justify-content: center;
  align-items: center;
  font-size: 150%;
  padding: 1rem;
}
</style>
