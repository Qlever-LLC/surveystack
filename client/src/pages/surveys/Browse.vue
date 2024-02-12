<template>
  <div class="wrapper">
    <a-container>
      <a-tabs v-model="activeTab" fixed-tabs>
        <a-tab v-for="tab in tabs" :href="`#${tab.name}`" :key="tab.name" :value="tab.name">
          <span v-if="tab.name === 'active-group'" class="text-no-wrap">
            {{ activeGroupName }}
          </span>
          <span v-else class="text-no-wrap">
            {{ tab.label }}
          </span>
        </a-tab>
      </a-tabs>
      <a-card class="my-2" v-if="activeTab === 'active-group' && pinnedSurveys.length && pinnedIsVisible">
        <a-card-text>
          <div v-for="(e, i) in pinnedSurveys" :key="`${e._id}_pinned`">
            <a-list-item :to="`/surveys/${e._id}`" :prepend-icon="e.pinned ? 'mdi-pin' : ''">
              <div>
                <a-list-item-title>{{ e.name }}</a-list-item-title>
                <a-list-item-subtitle v-if="e.meta.group && e.meta.group.id">
                  {{ getGroupName(e.meta.group.id) }}
                </a-list-item-subtitle>
                <small v-if="e.latestVersion" class="text-grey">Survey Version {{ e.latestVersion }}</small>
              </div>
            </a-list-item>
            <a-divider v-if="i < pinnedSurveys.length - 1" />
          </div>
        </a-card-text>
      </a-card>

      <a-card min-height="60vh" class="d-flex flex-column">
        <a-card-title />
        <a-card-text class="flex-grow-1">
          <div class="px-5 py-2">
            <a-text-field v-model="search" label="Search" append-inner-icon="mdi-magnify" />
            <div class="d-flex justify-end mb-4">
              <small class="text-secondary"> {{ surveys.pagination.total }} results </small>
            </div>
          </div>
          <a-list>
            <div v-for="(e, i) in surveys.content" :key="e._id">
              <a-list-item :to="`/surveys/${e._id}`">
                <template v-slot:prepend>
                  <a-icon :icon="getIcon(e)" :title="getTitle(e)" large />
                </template>
                <a-list-item-title>{{ e.name }}</a-list-item-title>
                <a-list-item-subtitle v-if="e.meta && e.meta.group && e.meta.group.id">
                  {{ getGroupName(e.meta.group.id) }}
                </a-list-item-subtitle>
                <small v-if="e.latestVersion" class="text-grey">Survey Version {{ e.latestVersion }}</small>
                <br />
                <small v-if="e.createdAgo" class="text-grey">created {{ e.createdAgo }} ago</small>
              </a-list-item>
              <a-divider v-if="i < surveys.content.length - 1" />
            </div>
          </a-list>
          <div v-if="surveys.content.length < 1" class="py-12 text-center">No surveys available</div>
        </a-card-text>
        <a-card-actions>
          <a-pagination
            v-if="surveys.content.length > 0"
            v-model="page"
            :length="activeTabPaginationLength"
            @update:modelValue="() => getDataForTab(activeTab)" />
        </a-card-actions>
      </a-card>
    </a-container>
  </div>
</template>

<script>
import isValid from 'date-fns/isValid';
import parseISO from 'date-fns/parseISO';
import formatDistance from 'date-fns/formatDistance';
import api from '@/services/api.service';

const PAGINATION_LIMIT = 10;

export default {
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
    getIcon(e) {
      if (e.pinned) {
        return 'mdi-pin';
      } else if (e.meta.submissions === 'public' || !e.meta.submissions) {
        return 'mdi-earth';
      } else if (e.meta.submissions === 'user') {
        return 'mdi-account';
      } else if (e.meta.submissions === 'group') {
        return 'mdi-account-group';
      }
    },
    getTitle(e) {
      if (e.meta.submissions === 'public' || !e.meta.submissions) {
        return 'Everyone can submit';
      } else if (e.meta.submissions === 'user') {
        return 'Only signed-in users can submit';
      } else if (e.meta.submissions === 'group') {
        return 'Everyone group members can submit';
      }
    },
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

<style scoped lang="scss">
/* fix tabs indentation on mobile */
>>> .v-slide-group__prev {
  display: none !important;
}

.wrapper {
  background-color: rgb(var(--v-theme-background));
  width: 100%;
  height: 100%;
}
</style>
