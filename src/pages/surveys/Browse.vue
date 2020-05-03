<template>
  <v-container>
    <div class="px-5 py-2">
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
      <!-- <v-menu
        v-if="groupsItems.length"
        bottom
        left
      >
        <template v-slot:activator="{ on }">
          <v-btn
            text
            class="align-self-center mr-4"
            v-on="on"
          >
            more
            <v-icon right>mdi-menu-down</v-icon>
          </v-btn>
        </template>
        <v-list class="">
          <v-list-item
            v-for="item in groupsItems"
            :key="item.name"
            @click="setMenuTab(item)"
          >
            {{ item.label }}
          </v-list-item>
        </v-list>
      </v-menu> -->
    </v-tabs>
    <v-card class="my-2" v-if="activeTab === 'active-group'">
      <v-card-text>
        <div
          v-for="(e, i) in pinnedSurveys"
          :key="`${e._id}_pinned`"
        >
          <v-list-item :to="`/surveys/${e._id}`">
            <v-list-item-icon>
              <v-icon v-if="e.pinned">mdi-pin</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <div>
                <v-list-item-title>{{e.name}}</v-list-item-title>
                <v-list-item-subtitle>{{e._id}}</v-list-item-subtitle>
                <v-list-item-subtitle v-if="e.group && e.group.id">
                  {{ getGroupName(e.group.id) }}
                </v-list-item-subtitle>
                <small v-if="e.latestVersion" class="grey--text">Survey Version {{e.latestVersion}}</small>
              </div>
            </v-list-item-content>

          </v-list-item>
          <v-divider v-if="i < pinnedSurveys.length - 1" />
        </div>
      </v-card-text>
    </v-card>
    <v-card
      min-height="60vh"
      class="d-flex flex-column"
    >
      <v-card-title>

      </v-card-title>
      <v-card-text class="flex-grow-1">


        <div
          v-for="(e, i) in surveys.content"
          :key="e._id"
        >
          <v-list-item :to="`/surveys/${e._id}`">
            <v-list-item-icon>
              <v-icon v-if="e.pinned">mdi-pin</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <div>
                <v-list-item-title>{{e.name}}</v-list-item-title>
                <v-list-item-subtitle>{{e._id}}</v-list-item-subtitle>
                <v-list-item-subtitle v-if="e.group && e.group.id">
                  {{ getGroupName(e.group.id) }}
                </v-list-item-subtitle>
                <small v-if="e.latestVersion" class="grey--text">Survey Version {{e.latestVersion}}</small>
              </div>
            </v-list-item-content>

          </v-list-item>
          <v-divider v-if="i < surveys.content.length - 1" />

        </div>
        <div
          v-if="surveys.content.length < 1"
          class="py-12 text-center"
        >
          No surveys available
        </div>
      </v-card-text>
      <v-card-actions>
        <v-pagination
          v-if="surveys.content.length > 0"
          v-model="page"
          :length="activeTabPaginationLength"
          @input="() => getDataForTab(activeTab)"
        />
      </v-card-actions>
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
import { uniqBy } from 'lodash';
import api from '@/services/api.service';

const PAGINATION_LIMIT = 5;

export default {
  data() {
    return {
      selectedGroupIds: [],
      activeTab: null,
      // groups: null,
      page: 1,
      search: '',
      pinnedSurveys: [],
      surveys: {
        content: [],
        pagination: {
          total: 0,
          skip: 0,
          limit: 100000,
        },
      },

      surveysForCurrentGroup: null,
    };
  },
  computed: {
    // activeTabHasMorePages() {
    //   return this.surveys
    //     && this.surveys.pagination
    //     && this.surveys.pagination.total
    //     && this.surveys.pagination.total > limit;
    // }
    tabs() {
      const commonTabs = [
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
      ];

      if (!this.activeGroupId) {
        return commonTabs;
      }

      return [
        // {
        //   name: 'active-group-pinned-surveys',
        //   label: 'Pinned Surveys',
        // },
        {
          name: 'active-group',
          label: 'Active Group',
        },
        ...commonTabs,
      ];
    },
    activeTabPaginationLength() {
      const { total } = this.surveys.pagination;
      return total ? Math.ceil(total / PAGINATION_LIMIT) : 0;
    },
    activeGroupId() {
      return this.$store.getters['memberships/activeGroup'];
    },
    groups() {
      return this.$store.getters['memberships/groups'];
    },
    groupsItems() {
      return this.groups
        .map(({ _id, name, slug }) => ({ id: _id, label: name, name: slug }));
    },
    activeGroupName() {
      const group = this.groups.find(item => item._id === this.activeGroupId);
      if (group) {
        return group.name;
      }
      return 'No active group';
    },
  },
  watch: {
    search() {
      this.fetchData();
    },
    async activeTab(value) {
      console.log(value);
      await this.getDataForTab(value);
    },
    async activeGroupId(value) {
      if (this.activeTab === 'active-group') {
        await this.getDataForTab('active-group');
      }
    },
  },
  methods: {
    getGroupName(id) {
      const group = this.groups.find(item => item._id === id);
      if (group) {
        return group.name;
      }
      return null;
    },
    setMenuTab(tab) {
      this.activeTab = tab.name;
      this.selectedGroupIds = [tab.id];
      this.fetchData({ groups: [tab.id] });
    },
    async getDataForTab(tab) {
      switch (tab) {
        case 'active-group-pinned-surveys':
          this.surveys = await this.fetchPinnedSurveys(this.activeGroupId);
          break;
        case 'active-group':
          // eslint-disable-next-line no-case-declarations
          const [pinnedResponse, response] = await Promise.all([
            this.fetchPinnedSurveys(this.activeGroupId),
            this.fetchData({ groups: [this.activeGroupId] }),
          ]);

          // this.surveys.content = uniqBy([
          //   ...pinnedResponse.map(r => ({ ...r, pinned: true })),
          //   ...response.content,
          // ], '_id');
          // this.surveys.pagination = {
          //   ...response.pagination,
          //   total: this.surveys.content.length,
          // };
          this.surveys = response;
          this.pinnedSurveys = pinnedResponse.map(r => ({ ...r, pinned: true }));
          break;
        case 'my-surveys':
          this.surveys = await this.fetchData({ user: this.$store.getters['auth/user']._id });
          break;
        case 'my-groups':
          this.surveys = await this.fetchData({
            groups: this.$store.getters['memberships/groups'].map(({ _id }) => _id),
          });
          break;
        case 'select-group':
          break;
        case 'all-groups':
        default:
          this.surveys = await this.fetchData();
      }
    },
    async fetchData({ user, groups = [] } = {}) {
      //  TODO create two lists, filter by active group and others
      // const groupsParam = (groups || [this.activeGroupId]).map(group => `group[]=${group}`).join('&');

      const queryParams = new URLSearchParams();
      if (user) {
        queryParams.append('creator', user);
      }
      if (groups.length > 0) {
        groups.filter(group => group !== null).forEach(group => queryParams.append('groups[]', group));
      }
      if (this.search) {
        queryParams.append('q', this.search);
      }

      queryParams.append('skip', (this.page - 1) * PAGINATION_LIMIT);
      queryParams.append('limit', PAGINATION_LIMIT);

      try {
        // const { data } = await api.get(`/surveys/page?${queryParams}`);
        const { data } = await api.get(`/surveys/list-page?${queryParams}`);
        return data;
      } catch (e) {
        // TODO: use cached data?
        console.log('Error fetching surveys:', e);
      }
      return [];
    },
    async fetchPinnedSurveys(groupId) {
      console.log('fetch pinned');
      try {
        const { data } = await api.get(`/groups/${groupId}?populate=1`);
        if (data && data.surveys && data.surveys.pinned && Array.isArray(data.surveys.pinned)) {
          return data.surveys.pinned;
        }
      } catch (err) {
        console.log('Error fetching surveys:', err);
      }
      return [];
    },
  },
};
</script>
