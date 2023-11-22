<template>
  <a-container>
    <app-basic-list :entities="entities" title="Resources" />
  </a-container>
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
    async fetchData() {
      const { data } = await api.get('/resources');
      this.entities = data;
    },
  },
  async created() {
    this.fetchData();
  },
};
</script>
