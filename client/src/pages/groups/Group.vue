<template>
  <v-container v-if="initialized && status.code === 200">
    <div class="d-flex justify-space-between align-center">
      <app-group-breadcrumbs :path="entity.path" />

      <div v-if="editable">
        <v-btn class="ml-auto" :to="{ name: 'groups-edit', params: { id: entity._id } }" text>
          <a-icon left>mdi-cog</a-icon> Admin
        </v-btn>
      </div>
    </div>

    <div style="color: red" v-if="entity.meta.archived">
      <strong>Please note:</strong> this group is currently archived
    </div>
    <h1>
      <span>{{ entity.name }}</span>
      <a-chip v-if="isPremium" class="ml-2" color="success"> <a-icon small left> mdi-octagram </a-icon>Premium </a-chip>
    </h1>
    <h3 class="text--secondary">{{ entity.path }}</h3>
    <div class="text--secondary body-2">{{ entity._id }}</div>

    <v-row>
      <v-col>
        <div class="d-flex justify-end">
          <a-checkbox class="mt-0" v-model="showArchivedSubgroups" label="View archived" dense hide-details />
        </div>
        <app-basic-list
          :editable="editable"
          :entities="subgroups"
          title="Subgroups"
          :link="(e) => `/g${e.path}`"
          :linkNew="{ name: 'groups-new', query: { dir: entity.path } }"
        >
          <template v-slot:entity="{ entity }">
            <v-list-item-content>
              <a-list-item-title>{{ entity.name }}</a-list-item-title>
              <a-list-item-subtitle>{{ entity.path }}</a-list-item-subtitle>
            </v-list-item-content>
          </template>
        </app-basic-list>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <app-basic-list
          :editable="editable"
          :entities="entity.surveys && entity.surveys.pinned ? entity.surveys.pinned : []"
          title="Pinned Surveys"
          :link="(e) => `/surveys/${e._id}`"
          :linkNew="`/groups/edit/${entity._id}`"
        >
          <template v-slot:entity="{ entity }">
            <v-list-item-content>
              <a-list-item-title>{{ entity.name }}</a-list-item-title>
              <a-list-item-subtitle>{{ entity._id }}</a-list-item-subtitle>
            </v-list-item-content>
          </template>
        </app-basic-list>
      </v-col>
    </v-row>
  </v-container>
  <v-container v-else-if="status.code === 404">
    <h1>Oh snap!</h1>
    <p>
      No group under <strong>{{ $route.params.pathMatch }}</strong> was found :/
    </p>
  </v-container>
</template>

<script>
import api from '@/services/api.service';
import appGroupBreadcrumbs from '@/components/groups/Breadcrumbs.vue';
import appBasicList from '@/components/ui/BasicList.vue';
import AIcon from '@/components/ui/AIcon.vue';

export default {
  name: 'Group',
  components: {
    AIcon,
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
        archived: false,
      },
      subgroups: [],
      showArchivedSubgroups: false,
    };
  },
  methods: {
    async getEntity(path) {
      this.initialized = false;
      try {
        const { data } = await api.get(`/groups/by-path/${path}?populate=true`);
        this.entity = data;
        await this.getSubgroups();
      } catch (e) {
        this.status.code = e.response.status;
        this.status.message = e.response.data.message;
      }
    },
    async getSubgroups() {
      try {
        const { data } = await api.get(`/groups?showArchived=${this.showArchivedSubgroups}&dir=${this.entity.path}`);
        this.subgroups = data;
      } catch (e) {
        this.status.code = e.response.status;
        this.status.message = e.response.data.message;
      }
    },
  },
  watch: {
    showArchivedSubgroups() {
      this.getSubgroups();
    },
  },
  computed: {
    user() {
      return this.$store.getters['auth/user'];
    },
    userMemberships() {
      return this.$store.getters['memberships/memberships'];
    },
    editable() {
      const g = this.userMemberships.find((m) => m.group._id === this.entity._id);
      if (g && g.role === 'admin') {
        return true;
      }
      if (this.$store.getters['auth/isSuperAdmin']) {
        return true;
      }
      return false;
    },
    isWhitelabel() {
      return this.$store.getters['whitelabel/isWhitelabel'];
    },
    whitelabelPartner() {
      return this.$store.getters['whitelabel/partner'];
    },
    isPremium() {
      if (
        this.isWhitelabel &&
        (this.entity.path.startsWith(this.whitelabelPartner.path) ||
          this.entity.dir.startsWith(this.whitelabelPartner.path))
      ) {
        return true;
      }
      return false;
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
    const user = this.$store.getters['auth/user'];
    this.$store.dispatch('memberships/getUserMemberships', user._id);
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
