<template>
  <v-container>
    <div class="d-flex justify-end">
      <v-checkbox
        v-model="showArchived"
        label="View archived"
        dense
        hide-details
      />
    </div>
    <app-basic-list
      editable
      class="mt-3"
      :entities="entities"
      title="Groups"
      :link="(e) => `/g${e.path}`"
      :linkNew="{name: 'groups-new', query: {dir: rootDir}}"
    >

      <template v-slot:entity="{ entity }">
        <v-list-item-content>
          <v-list-item-title>{{entity.name}}</v-list-item-title>
          <v-list-item-subtitle>{{entity.path}}</v-list-item-subtitle>
        </v-list-item-content>
      </template>

    </app-basic-list>

  </v-container>
</template>

<script>
import api from '@/services/api.service';
import appBasicList from '@/components/ui/BasicList.vue';

export default {
  components: {
    appBasicList,
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
        const { groupSlug } = this.whitelabelPartner;
        const { data } = await api.get(`/groups?showArchived=${this.showArchived}&prefix=/${groupSlug}/`);
        this.entities = data;
        return;
      }

      const { data } = await api.get(`/groups?showArchived=${this.showArchived}`);
      this.entities = data;
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
        return `/${this.whitelabelPartner.groupSlug}/`;
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
