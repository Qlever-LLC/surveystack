<template>
  <div class="wrapper">
    <a-container>
      <basic-list
        @updateSearch="updateSearch"
        @toogleStar="toogleStar"
        listCard
        :entities="surveys.content"
        enableFav
        :pinnedSurveys="pinnedSurveys"
        :buttonNew="{ title: 'Create new Survey', link: { name: 'groups-new' } }"
        :menu="[
          {
            title: 'todo',
            icon: 'mdi-open-in-new',
            action: (e) => `/groups/${$route.params.id}/surveys/${e._id}`,
            color: 'green',
          },
          { title: `todo`, icon: 'mdi-file-document', action: (e) => `/groups/${$route.params.id}/surveys/${e._id}` },
        ]"
        :page="page">
        <template v-slot:title>
          <a-icon class="mr-2"> mdi-cube-outline </a-icon>
          Surveys
          <a-chip class="ml-4" color="accent" rounded="lg" variant="flat" disabled>
            {{ surveys.pagination.total }}
          </a-chip>
        </template>
        <template v-slot:noValue> No Surveys available </template>
        <template v-slot:pagination>
          <a-pagination
            v-if="surveys.content.length > 0"
            v-model="page"
            :length="activeTabPaginationLength"
            @update:modelValue="() => getDataForTab()" />
        </template>
      </basic-list>
    </a-container>
  </div>
</template>

<script>
import isValid from 'date-fns/isValid';
import parseISO from 'date-fns/parseISO';
import formatDistance from 'date-fns/formatDistance';
import api from '@/services/api.service';

import BasicList from '@/components/ui/BasicList2.vue';

const PAGINATION_LIMIT = 10;

export default {
  components: {
    BasicList,
  },
  data() {
    return {
      selectedGroupIds: [],
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
    };
  },
  computed: {
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
    isWhitelabel() {
      return this.$store.getters['whitelabel/isWhitelabel'];
    },
    whitelabelPartner() {
      return this.$store.getters['whitelabel/partner'];
    },
  },
  mounted: async function () {
    await this.getDataForTab();
  },
  watch: {
    async activeGroupId(value) {
      await this.getDataForTab();
    },
  },
  methods: {
    updateSearch(val) {
      this.search = val;
      this.page = 1;
      this.getDataForTab();
    },
    async toogleStar(entity) {
      const group = this.groups.find((g) => g._id === this.activeGroupId);
      const index = group.surveys.pinned.indexOf(entity._id);
      if (index > -1) {
        group.surveys.pinned.splice(index, 1);
      } else {
        group.surveys.pinned.push(entity._id);
      }

      await api.put(`/groups/${group._id}`, group);
      await this.getDataForTab();
    },
    async getDataForTab() {
      const activeGroupId = this.$store.getters['memberships/activeGroup'];
      // eslint-disable-next-line no-case-declarations
      const [pinnedResponse, response] = await Promise.all([
        this.fetchPinnedSurveys(activeGroupId),
        this.fetchData({ groups: [activeGroupId] }),
      ]);
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
          return this.pinnedSurveys.sort((a, b) => a.name.localeCompare(b.name));
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
.wrapper {
  background-color: rgb(var(--v-theme-background));
  width: 100%;
  height: 100%;
}
</style>
