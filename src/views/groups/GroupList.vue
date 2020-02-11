<template>
  <v-container>
    <app-group-list
      :entities="entities"
      class="mt-3"
    >
      <template v-slot:header>
        <h1>Groups</h1>
      </template>
    </app-group-list>
  </v-container>
</template>

<script>
import api from '@/services/api.service';
import appGroupList from '@/components/groups/GroupList.vue';

export default {
  components: {
    appGroupList,
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
