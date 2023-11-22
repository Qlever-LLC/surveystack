<template>
  <a-container>
    <div class="d-flex justify-end">
      <a-checkbox v-model="showArchived" label="View archived" dense hide-details />
    </div>
    <app-basic-list
      editable
      class="mt-3"
      :entities="entities"
      title="Groups"
      :link="(e) => `/g${e.path}`"
      :linkNew="{ name: 'groups-new', query: { dir: rootDir } }"
    >
      <template v-slot:entity="{ entity }">
        <v-list-item-content>
          <a-list-item-title>{{ entity.name }}</a-list-item-title>
          <a-list-item-subtitle>{{ entity.path }}</a-list-item-subtitle>
        </v-list-item-content>
      </template>
    </app-basic-list>
  </a-container>
</template>

<script>
import api from '@/services/api.service';
import appBasicList from '@/components/ui/BasicList.vue';
import AContainer from '@/components/ui/AContainer.vue';

export default {
  components: {
    appBasicList,
    AContainer,
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
        const { data: entities } = await api.get(`/groups?showArchived=${this.showArchived}&prefix=${path}`);
        this.entities = entities;
        return;
      }

      const { data: entities } = await api.get(`/groups?showArchived=${this.showArchived}`);
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
