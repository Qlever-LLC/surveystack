<template>
  <div class="wrapper">
    <v-container>
      <v-tabs v-model="activeTab" fixed-tabs>
        <v-tab v-for="tab in tabs" :href="`#${tab.name}`" :key="tab.name">
          <span v-if="tab.name === 'active-group'" class="text-no-wrap">
            {{ activeGroupName }}
          </span>
          <span v-else class="text-no-wrap">
            {{ tab.label }}
          </span>
        </v-tab>
      </v-tabs>
      <v-card class="my-2" v-if="activeTab === 'active-group' && pinnedSurveys.length && pinnedIsVisible">
        <v-card-text>
          <div v-for="(e, i) in pinnedSurveys" :key="`${e._id}_pinned`">
            <v-list-item :to="`/surveys/${e._id}`">
              <v-list-item-icon>
                <v-icon v-if="e.pinned">mdi-pin</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <div>
                  <v-list-item-title>{{ e.name }}</v-list-item-title>
                  <v-list-item-subtitle v-if="e.meta.group && e.meta.group.id">
                    {{ getGroupName(e.meta.group.id) }}
                  </v-list-item-subtitle>
                  <small v-if="e.latestVersion" class="grey--text">Survey Version {{ e.latestVersion }}</small>
                </div>
              </v-list-item-content>
            </v-list-item>
            <v-divider v-if="i < pinnedSurveys.length - 1" />
          </div>
        </v-card-text>
      </v-card>

      <v-card min-height="60vh" class="d-flex flex-column">
        <v-card-title> </v-card-title>
        <v-card-text class="flex-grow-1">
          <div class="px-5 py-2">
            <v-text-field v-model="search" label="Search" append-icon="mdi-magnify" />
            <div class="d-flex justify-end mb-4">
              <small class="text--secondary"> {{ surveys.pagination.total }} results </small>
            </div>
          </div>
          <div v-for="(e, i) in surveys.content" :key="e._id">
            <v-list-item :to="`/surveys/${e._id}`">
              <v-list-item-icon>
                <v-icon v-if="e.pinned">mdi-pin</v-icon>
                <v-btn
                  v-if="e.meta.submissions === 'public' || !e.meta.submissions"
                  :to="`/surveys/${e._id}`"
                  title="Everyone can submit"
                  icon
                >
                  <v-icon>mdi-earth</v-icon>
                </v-btn>
                <v-btn
                  v-if="e.meta.submissions === 'user'"
                  :to="`/surveys/${e._id}`"
                  title="Only signed-in users can submit"
                  icon
                >
                  <v-icon>mdi-account</v-icon>
                </v-btn>
                <v-btn
                  v-if="e.meta.submissions === 'group'"
                  :to="`/surveys/${e._id}`"
                  title="Everyone group members can submit"
                  icon
                >
                  <v-icon>mdi-account-group</v-icon>
                </v-btn>
              </v-list-item-icon>
              <v-list-item-content>
                <div>
                  <v-list-item-title>{{ e.name }}</v-list-item-title>
                  <v-list-item-subtitle v-if="e.meta && e.meta.group && e.meta.group.id">
                    {{ getGroupName(e.meta.group.id) }}
                  </v-list-item-subtitle>
                  <small v-if="e.latestVersion" class="grey--text">Survey Version {{ e.latestVersion }}</small>
                  <br />
                  <small v-if="e.createdAgo" class="grey--text">created {{ e.createdAgo }} ago</small>
                </div>
              </v-list-item-content>
            </v-list-item>
            <v-divider v-if="i < surveys.content.length - 1" />
          </div>
          <div v-if="surveys.content.length < 1" class="py-12 text-center">No surveys available</div>
        </v-card-text>
        <v-card-actions>
          <a-pagination
            v-if="surveys.content.length > 0"
            v-model="page"
            :length="activeTabPaginationLength"
            @input="() => getDataForTab(activeTab)"
          />
        </v-card-actions>
      </v-card>
    </v-container>
  </div>
</template>

<script>
import isValid from 'date-fns/isValid';
import parseISO from 'date-fns/parseISO';
import formatDistance from 'date-fns/formatDistance';
import api from '@/services/api.service';
import APagination from '@/components/ui/APagination.vue';

const PAGINATION_LIMIT = 10;

export default {
  components: {
    APagination,
  },
  data() {
    return {
      selectedGroupIds: [],
      activeTab: null,
      page: 1,
      search: '',
      pinnedSurveys: [],
      pinnedIsVisible: true,
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
    tabs() {
      const tabs = [
        {
          name: 'all-groups',
          label: 'All Groups',
        },
      ];

      const loggedInTabs = [
        {
          name: 'my-surveys',
          label: 'My Surveys',
        },
        {
          name: 'my-groups',
          label: 'My Groups',
        },
      ];

      const activeGroupTabs = [
        {
          name: 'active-group',
          label: 'Active Group',
        },
      ];

      if (this.isLoggedIn) {
        tabs.unshift(...loggedInTabs);
        if (this.activeGroupId) {
          tabs.unshift(...activeGroupTabs);
        }
      }

      return tabs;
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
      return this.groups.map(({ _id, name, slug }) => ({ id: _id, label: name, name: slug }));
    },
    activeGroupName() {
      const group = this.groups.find((item) => item._id === this.activeGroupId);
      if (group) {
        return group.name;
      }
      return 'No active group';
    },
    isLoggedIn() {
      return this.$store.getters['auth/isLoggedIn'];
    },
    isWhitelabel() {
      return this.$store.getters['whitelabel/isWhitelabel'];
    },
    whitelabelPartner() {
      return this.$store.getters['whitelabel/partner'];
    },
  },
  watch: {
    search(value) {
      this.page = 1;
      this.getDataForTab(this.activeTab);
    },
    // TODO: reimplement with @change listener instead of watch
    async activeTab(value) {
      this.page = 1;
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
      const group = this.groups.find((item) => item._id === id);
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
        case 'active-group':
          // eslint-disable-next-line no-case-declarations
          const [pinnedResponse, response] = await Promise.all([
            this.fetchPinnedSurveys(this.activeGroupId),
            this.fetchData({ groups: [this.activeGroupId] }),
          ]);
          break;
        case 'my-surveys':
          await this.fetchData({ user: this.$store.getters['auth/user']._id });
          break;
        case 'my-groups':
          this.surveys = await this.fetchData({
            groups: this.$store.getters['memberships/groups'].map(({ _id }) => _id),
          });
          break;
        case 'all-groups':
        default:
          this.surveys = await this.fetchData();
      }
    },
    async fetchData({ user, groups = [] } = {}) {
      //  TODO create two lists, filter by active group and others
      // const groupsParam = (groups || [this.activeGroupId]).map(group => `group[]=${group}`).join('&');
      const now = new Date();
      const queryParams = new URLSearchParams();
      if (user) {
        queryParams.append('creator', user);
      }
      if (groups.length > 0) {
        groups.filter((group) => group !== null).forEach((group) => queryParams.append('groups[]', group));
      }
      if (this.search) {
        queryParams.append('q', this.search);
        console.log(this.search);
      }
      if (this.isWhitelabel) {
        queryParams.append('prefix', this.whitelabelPartner.path);
      }

      queryParams.append('skip', (this.page - 1) * PAGINATION_LIMIT);
      queryParams.append('limit', PAGINATION_LIMIT);

      try {
        const { data } = await api.get(`/surveys/list-page?${queryParams}`);
        this.surveys = data;
        this.surveys.content.forEach((s) => {
          if (s.meta) {
            const parsedDate = parseISO(s.meta.dateCreated);
            if (isValid(parsedDate)) {
              s.createdAgo = formatDistance(parsedDate, now);
            }
          }
        });
        return data;
      } catch (e) {
        // TODO: use cached data?
        console.log('Error fetching surveys:', e);
      }
      // return [];
      return {
        content: [],
        pagination: {
          parsedLimit: 10,
          parsedSkip: 0,
          total: 0,
        },
      };
    },
    async fetchPinnedSurveys(groupId) {
      // TODO replace with new store action (?)
      try {
        console.log('fetch pinned');
        const { data } = await api.get(`/groups/${groupId}?populate=1`);
        if (data && data.surveys && data.surveys.pinned && Array.isArray(data.surveys.pinned)) {
          this.pinnedSurveys = data.surveys.pinned.map((r) => ({ ...r, pinned: true }));
          return this.pinnedSurveys;
        }
      } catch (err) {
        console.log('Error fetching surveys:', err);
      }
      this.pinnedSurveys = [];
      return [];
    },
  },
};
</script>

<style scoped>
/* fix tabs indentation on mobile */
>>> .v-slide-group__prev {
  display: none !important;
}

.wrapper {
  background-color: var(--v-background-base);
  width: 100%;
  height: 100%;
}
</style>
