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
      :linkNew="{name: 'groups-new', query: {dir: '/'}}"
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
      const { data } = await api.get(`/groups?showArchived=${this.showArchived}`);
      this.entities = data;
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
