<template>
  <div>
    <app-group-list :entities="entities" />
  </div>
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
