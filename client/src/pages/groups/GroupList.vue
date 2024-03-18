<template>
  <a-container>
    <basic-list
      listCard
      :entities="entities"
      groupStyle
      :buttonNew="{ title: 'Create a Group', link: { name: 'groups-new', query: { dir: rootDir } } }"
      :menu="[
        { title: 'Go to Group', icon: 'mdi-open-in-new', action: (e) => `/g${e.path}`, color: 'green' },
        { title: `See Group's Surveys`, icon: 'mdi-file-document', action: (e) => `/groups/${e._id}/surveys` },
      ]">
      <template v-slot:title>
        <a-icon class="mr-2"> mdi-compass-outline </a-icon>
        Find a group
        <a-chip class="ml-4" color="accent" rounded="lg" variant="flat" disabled> {{ entities.length }} </a-chip>
      </template>
      <template v-slot:filter>
        <a-checkbox v-model="showArchived" label="View archived" dense hide-details color="primary" />
      </template>
      <template v-slot:noValue> No Groups available </template>
    </basic-list>
  </a-container>
</template>

<script>
import api from '@/services/api.service';
import BasicList from '@/components/ui/BasicList2.vue';
import AppNavigationControl from '@/components/AppNavigationControl.vue';

export default {
  components: {
    AppNavigationControl,
    BasicList,
  },
  data() {
    return {
      entities: [],
      showArchived: false,
    };
  },
  methods: {
    async fetchEntities() {
      if (this.isWhitelabel) {
        const { path } = this.whitelabelPartner;
        const { data: entities } = await api.get(`/groups/all?showArchived=${this.showArchived}&prefix=${path}`);
        this.entities = entities;
        return;
      }

      const { data: entities } = await api.get(`/groups/all?showArchived=${this.showArchived}`);
      this.entities = entities;
    },
  },
  computed: {
    isWhitelabel() {
      return this.$store.getters['whitelabel/isWhitelabel'];
    },
    whitelabelPartner() {
      return this.$store.getters['whitelabel/partner'];
    },
    rootDir() {
      if (this.isWhitelabel) {
        return this.whitelabelPartner.path;
      }

      return '/';
    },
  },
  watch: {
    showArchived() {
      this.fetchEntities();
    },
  },
  created() {
    this.fetchEntities();
  },
};
</script>
