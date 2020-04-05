<template>
  <v-container v-if="initialized && status.code === 200">
    <div class="d-flex justify-space-between align-center">
      <app-group-breadcrumbs :path="entity.path" />
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
    <h3 class="text--secondary">{{entity.path}}</h3>

    <v-row>
      <v-col
        cols="12"
        lg="6"
      >
        <app-group-list
          :entities="subgroups"
          :dir="entity.path"
          title="Subgroups"
        />
      </v-col>
      <v-col
        cols="12"
        lg="6"
      >
        <app-group-member-list
          :entities="members"
          :group="entity"
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
import appGroupMemberList from '@/components/groups/GroupMemberList.vue';
import appGroupBreadcrumbs from '@/components/groups/Breadcrumbs.vue';

export default {
  name: 'Group',
  components: {
    appGroupList,
    appGroupMemberList,
    appGroupBreadcrumbs,
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
        path: '/',
      },
      members: [],
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
        await this.getMembers();
      } catch (e) {
        this.status.code = e.response.status;
        this.status.message = e.response.data.message;
      }
    },
    async getSubgroups() {
      try {
        const { data } = await api.get(`/groups?dir=${this.entity.path}`);
        this.subgroups = data;
      } catch (e) {
        this.status.code = e.response.status;
        this.status.message = e.response.data.message;
      }
    },
    async getMembers() {
      const { data } = await api.get(`/memberships?group=${this.entity._id}&populate=true`);
      this.members = data;
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
