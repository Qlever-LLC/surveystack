<template>
  <v-container v-if="initialized">
    <span v-if="entity.path">
      <router-link
        :to="`/groups/${entity.path}`"
        class="text-muted"
      >{{entity.path}}</router-link>
    </span>
    <h1>
      {{entity.name}}
      <small>
        <router-link
          :to="{name: 'groups-edit', params: {id: entity._id}}"
          class="text-muted"
        >edit</router-link>
      </small>
    </h1>

    <div class="mt-2">
      <app-group-list
        :entities="subgroups"
        title="Subgroups"
        :path="subgroupPath"
      />
      <ul
        v-if="initialized && subgroups.length === 0"
        class="list-group"
      >
        <li class="list-group-item text-muted">
          No subgroups found...
          <v-btn :to="{name: 'groups-new', query: {path: subgroupPath}}">Create one now</v-btn>
        </li>
      </ul>
    </div>

    <div class="nav nav-tabs mt-4">
      <li class="nav-item">
        <a
          class="nav-link active"
          href="#"
        >Surveys</a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          href="#"
        >Dashboards</a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          href="#"
        >Scripts</a>
      </li>
    </div>
  </v-container>
</template>

<script>
import api from '@/services/api.service';
import appGroupList from '@/components/groups/GroupList.vue';

import { GROUP_PATH_DELIMITER } from '@/constants';

export default {
  name: 'Group',
  components: {
    appGroupList,
  },
  data() {
    return {
      initialized: false,
      status: '',
      entity: {
        _id: '',
        name: '',
        path: null,
      },
      subgroups: [],
    };
  },
  methods: {
    async getEntity(id) {
      this.initialized = false;
      try {
        const { data } = await api.get(`/groups/by-path/${id}`);
        this.entity = data;
        this.getSubgroups();
      } catch (e) {
        this.status = e.response.data;
      }
    },
    async getSubgroups() {
      try {
        let childrenPath = `${this.entity.path}${this.entity.name}${GROUP_PATH_DELIMITER}`;
        if (this.entity.path === null) {
          childrenPath = `${GROUP_PATH_DELIMITER}${this.entity.name}${GROUP_PATH_DELIMITER}`;
        }

        const { data } = await api.get(`/groups?path=${childrenPath}`);
        this.subgroups = data;
        this.initialized = true;
      } catch (e) {
        this.status = e.response.data;
      }
    },
  },
  computed: {
    subgroupPath() {
      if (!this.entity.path) {
        return `${GROUP_PATH_DELIMITER}${this.entity.name}${GROUP_PATH_DELIMITER}`;
      }
      return `${this.entity.path}${this.entity.name}${GROUP_PATH_DELIMITER}`;
    },
  },
  beforeRouteUpdate(to, from, next) {
    const { pathMatch } = to.params;
    this.getEntity(pathMatch);
    next();
  },
  created() {
    const { pathMatch } = this.$route.params;
    this.getEntity(pathMatch);
  },
};
</script>

<style scoped>
h1,
h2 {
  margin-bottom: 0px;
}

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
