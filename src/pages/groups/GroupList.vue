<template>
  <v-container>
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
    };
  },
  methods: {
    async fetchEntities() {
      const r = await api.get('/groups');
      this.entities = r.data;
    },
  },
  created() {
    this.fetchEntities();
  },
};
</script>
