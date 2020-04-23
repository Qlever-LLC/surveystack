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
        <app-basic-list
          :entities="subgroups"
          title="Subgroups"
          :link="(e) => `/g${e.path}`"
          :linkNew="{name: 'groups-new', query: {dir: entity.path}}"
        >
          <template v-slot:entity="{ entity }">
            <v-list-item-content>
              <v-list-item-title>{{entity.name}}</v-list-item-title>
              <v-list-item-subtitle>{{entity.path}}</v-list-item-subtitle>
            </v-list-item-content>
          </template>
        </app-basic-list>
      </v-col>
      <v-col
        cols="12"
        lg="6"
      >
        <app-basic-list
          :entities="members"
          title="Members"
          :link="(member) => `/memberships/${member._id}/edit`"
          :linkNew="{name: 'memberships-new', query: {group: entity._id, role: 'user' }}"
          :filter="filterMembers"
        >
          <template v-slot:entity="{ entity }">
            <v-list-item-content v-if="entity.meta.status === 'pending'">
              <v-list-item-title class="text--secondary">[Pending] Invitation</v-list-item-title>
              <v-list-item-subtitle>{{entity.meta.sentTo}}</v-list-item-subtitle>
            </v-list-item-content>

            <v-list-item-content v-else>
              <v-list-item-title>{{entity.user.name}}</v-list-item-title>
              <v-list-item-subtitle>{{entity.user.email}}</v-list-item-subtitle>
            </v-list-item-content>

            <v-list-item-action>
              <v-icon v-if="entity.role === 'admin'">mdi-crown-outline</v-icon>
            </v-list-item-action>
          </template>
        </app-basic-list>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <app-basic-list
          :entities="(entity.surveys && entity.surveys.pinned) ? entity.surveys.pinned : []"
          title="Pinned Surveys"
          :link="(e) => `/surveys/${e._id}`"
          linkNew="/surveys/browse"
        >
          <template v-slot:entity="{ entity }">
            <v-list-item-content>
              <v-list-item-title>{{entity.name}}</v-list-item-title>
              <v-list-item-subtitle>{{entity._id}}</v-list-item-subtitle>
            </v-list-item-content>
          </template>
        </app-basic-list>
      </v-col>
      <v-col>

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
import appGroupBreadcrumbs from '@/components/groups/Breadcrumbs.vue';
import appBasicList from '@/components/ui/BasicList.vue';

export default {
  name: 'Group',
  components: {
    appGroupBreadcrumbs,
    appBasicList,
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
        const { data } = await api.get(`/groups/by-path/${path}?populate=true`);
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
    filterMembers(entities, q) {
      if (!q) {
        return entities;
      }
      const ql = q.toLowerCase();

      return entities.filter((entity) => {
        if (entity.user) {
          if (entity.user.name.toLowerCase().indexOf(ql) > -1) {
            return true;
          }

          if (entity.user.email.toLowerCase().startsWith(ql)) {
            return true;
          }
        } else if (entity.meta.sentTo) {
          if (entity.meta.sentTo.toLowerCase().indexOf(ql) > -1) {
            return true;
          }
        }

        return false;
      });
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
