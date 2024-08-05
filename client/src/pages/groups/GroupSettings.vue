<template>
  <a-container class="basicListContainer">
    <a-card :loading="isLoadingGroup" color="background">
      <a-card-title class="text-heading d-flex pa-1">
        <a-col align="start" class="flex-grow-0">
          <AppNavigationControl />
        </a-col>
        <a-col class="flex-grow-1 pl-0" :class="'text-center'">
          <a-icon class="mr-2" icon="mdi-cog-outline" />
          Settings
          <a-chip v-if="isPremium" class="ml-2" color="success" rounded="lg" variant="flat" disabled>
            <a-icon small left> mdi-octagram </a-icon>Premium
          </a-chip>
        </a-col>
      </a-card-title>
      <a-card-text class="mt-5">
        <group-edit scope="edit" @changed="groupChanged" />
      </a-card-text>
      <basic-list
        listType="card"
        :showNavigationControl="false"
        :entities="subgroups"
        :loading="isLoadingGroup"
        groupStyle
        showGroupPath
        title="Subgroups"
        :menu="[
          {
            title: 'Go to Group',
            icon: 'mdi-open-in-new',
            action: (e) => `/groups/${e._id}`,
            color: 'green',
          },
        ]"
        :buttonNew="{ title: 'new...', link: { name: 'groups-new', query: { dir: entity.path } } }">
        <template v-slot:entityTitle="{ entity }"> {{ entity.name }} ! {{ entity.path }} </template>
        <template v-slot:filter>
          <a-checkbox v-model="this.showArchived" label="View archived" dense hide-details color="primary" />
        </template>
        <template v-slot:noValue> No Groups available </template>
      </basic-list>
      <basic-list
        listType="card"
        :showNavigationControl="false"
        :entities="integrations"
        title="Integrations"
        :menu="[
          {
            title: 'Go to',
            icon: 'mdi-open-in-new',
            action: (integration) => `/groups/${entity._id}/${integration.slug}`,
            color: 'green',
          },
        ]">
        <template v-slot:entitySubtitle="{ entity }">
          {{ entity.description }}
        </template>
      </basic-list>

      <app-doc-links class="ma-4" :group="entity"></app-doc-links>
    </a-card>
  </a-container>
</template>

<script>
import api from '@/services/api.service';
import appDocLinks from '@/components/groups/DocLinks.vue';
import BasicList from '@/components/ui/BasicList2.vue';
import { handleize } from '@/utils/groups';
import { SPEC_VERSION_GROUP } from '@/constants';
import GroupEdit from '@/components/groups/GroupEdit.vue';
import AppNavigationControl from '@/components/AppNavigationControl.vue';
import ACardText from '@/components/ui/elements/ACardText.vue';

const integrations = [
  {
    name: 'FarmOS',
    description: 'Manage FarmOS integration',
    slug: `farmos`, // used for the link /group-manage/farmos/$GROUP_ID
  },
  {
    name: 'Hylo',
    description: 'Manage Hylo integration',
    slug: `hylo`, // used for the link /group-manage/farmos/$GROUP_ID
  },
];

export default {
  components: {
    ACardText,
    AppNavigationControl,
    GroupEdit,
    appDocLinks,
    BasicList,
  },
  data() {
    return {
      editSlug: false,
      entity: {
        meta: {
          archived: false,
          specVersion: SPEC_VERSION_GROUP,
          invitationOnly: true,
        },
        name: '',
        slug: '',
        dir: '/',
        path: '',
        surveys: {
          pinned: [],
        },
      },
      subgroups: [],
      showArchived: false,
      searchResults: [],
      integrations,
      isLoadingGroup: false,
    };
  },
  methods: {
    async searchSurveys(q) {
      const { data: searchResults } = await api.get(
        `/surveys?projections[]=name&projections[]=meta.dateModified&q=${q}`
      );
      this.searchResults = searchResults;
    },
    async getSubgroups() {
      try {
        const { data } = await api.get(`/groups/all?showArchived=${this.showArchived}&dir=${this.entity.path}`);
        this.subgroups = data;
      } catch (e) {
        this.status.code = e.response.status;
        this.status.message = e.response.data.message;
      }
    },
    async groupChanged() {
      await this.getSubgroups();
    },
  },
  computed: {
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
  async created() {
    const { dir } = this.$route.query;
    if (dir) {
      this.entity.dir = dir;
      if (!this.entity.dir.endsWith('/')) {
        this.entity.dir += '/';
      }
    }

    this.isLoadingGroup = true;
    try {
      const { id } = this.$route.params;
      const { data } = await api.get(`/groups/${id}?populate=true`);
      this.entity = { ...this.entity, ...data };
      await this.getSubgroups();
    } catch (e) {
      console.log('something went wrong:', e);
    } finally {
      this.isLoadingGroup = false;
    }
  },
  watch: {
    showArchived: async function () {
      this.isLoadingGroup = true;
      await this.getSubgroups();
      this.isLoadingGroup = false;
    },
  },
};
</script>

<style scoped lang="scss">
.api-border {
  border: 1px solid rgba(0, 0, 0, 0.24);
  border-radius: 4px;
}

.revertPadding {
  padding: revert;
}
</style>
