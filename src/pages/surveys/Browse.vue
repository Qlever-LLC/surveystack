<template>
  <v-container>
    <v-text-field
      v-model="search"
      label="Search"
      append-icon="mdi-magnify"
    />
    <div class="d-flex justify-end mb-4">
      <small class="text--secondary">
        {{surveys.pagination.total}} results
      </small>
    </div>
    <v-tabs
      v-model="activeTab"
      fixed-tabs
    >
      <v-tab
        v-for="tab in tabs"
        :href="`#${tab.name}`"
        :key="tab.name"
      >
        <span v-if="tab.name === 'active-group'">
          {{ activeGroupName }}
        </span>
        <span v-else>
          {{ tab.label }}
        </span>
      </v-tab>
    </v-tabs>
    <!-- <v-tabs-items
      v-model="activeTab"
    >

    </v-tabs-items> -->
    <!-- <v-card>
      <v-card-text>
        {{}}
      </v-card-text>
    </v-card> -->
    <v-card>
      <div
        v-for="e in surveys.content"
        :key="e._id"
      >
        <v-list-item :to="`/surveys/${e._id}`">
          <v-list-item-content>

            <v-list-item-title>{{e.name}}</v-list-item-title>
            <v-list-item-subtitle>{{e._id}}</v-list-item-subtitle>
            <small class="grey--text">Version {{e.latestVersion}}</small>
          </v-list-item-content>

        </v-list-item>
        <v-divider />
      </div>
    </v-card>
    <!-- <v-row>
      <v-spacer />
      <v-btn
        outlined
        class="ma-8"
      >Show Others</v-btn>
    </v-row> -->
  </v-container>
</template>

<script>
import api from '@/services/api.service';

export default {
  data() {
    return {
      selectedGroupIds: [],
      activeTab: null,
      // groups: null,
      search: '',
      surveys: {
        content: [],
        pagination: {
          total: 0,
          skip: 0,
          limit: 100000,
        },
      },
      tabs: [
        {
          name: 'active-group',
          label: 'Active Group',
        },
        {
          name: 'my-surveys',
          label: 'My Surveys',
        },
        {
          name: 'my-groups',
          label: 'My Groups',
        },
        {
          name: 'all-groups',
          label: 'All Groups',
        },
      ],
      surveysForCurrentGroup: null,
    };
  },
  computed: {
    activeGroupId() {
      return this.$store.getters['memberships/activeGroup'];
    },
    groups() {
      return this.$store.getters['memberships/groups'];
    },
    groupsItems() {
      return this.groups.map(({ _id, name, slug }) => ({ id: _id, label: name, name: 'slug' }));
    },
    activeGroupName() {
      const groups = this.$store.getters['memberships/groups'];
      const { name } = groups.find(({ _id }) => this.activeGroupId === _id);
      return name;
    },
    // activeTabContent() {
    //   switch (this.activeTab) {
    //     case 'active-group':

    //       break;
    //     case 'my-surveys':
    //       break;
    //     case 'my-groups':
    //       break;
    //     case 'all-groups':
    //       break;
    //     default:
    //   }
    //   return '';
    // },
  },
  watch: {
    search() {
      this.fetchData();
    },
    async activeTab(value) {
      await this.getDataForTab(value);
    },
    async activeGroupId(value) {
      if (this.activeTab === 'active-group') {
        await this.getDataForTab('active-group');
      }
    },
  },
  methods: {
    async getDataForTab(tab) {
      switch (tab) {
        case 'active-group':
          await this.fetchData({ groups: [this.activeGroupId] });
          break;
        case 'my-surveys':
          await this.fetchData({ user: this.$store.getters['auth/user']._id });
          break;
        case 'my-groups':
          await this.fetchData({
            groups: this.$store.getters['memberships/groups'].map(({ _id }) => _id),
          });
          break;
        case 'select-group':
          break;
        case 'all-groups':
        default:
          await this.fetchData();
      }
    },
    async fetchData({ user, groups = [] } = {}) {
      //  TODO create two lists, filter by active group and others
      // const groupsParam = (groups || [this.activeGroupId]).map(group => `group[]=${group}`).join('&');

      const queryParams = new URLSearchParams();
      if (user) {
        queryParams.append('user', user);
      }
      if (groups.length > 0) {
        groups.forEach(group => queryParams.append('group[]', group));
      }
      if (this.search) {
        queryParams.append('q', this.search);
      }

      try {
        const { data } = await api.get(`/surveys/page?${queryParams}`);
        this.surveys = data;
      } catch (e) {
        // TODO: use cached data?
        console.log('something went wrong:', e);
      }
    },
  },
  async created() {
    this.selectedGroupIds = [this.activeGroupId];
    await this.fetchData({ groups: [this.activeGroupId] });
  },
};
</script>
