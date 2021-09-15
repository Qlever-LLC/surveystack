<template>
  <v-container>
    <v-text-field label="Search" v-model="q" append-icon="mdi-magnify" clearable />
    <app-entity-list :entities="entities" collection="scripts" />
  </v-container>
</template>

<script>
import api from '@/services/api.service';
import appEntityList from '@/components/ui/EntityList.vue';

export default {
  components: {
    appEntityList,
  },
  data() {
    return {
      entities: [],
      q: '',
    };
  },
  watch: {
    q(newVal) {
      // clicking on the clearable icon sets q to null
      // but we actually want an empty string
      if (newVal === null) {
        this.q = '';
        return;
      }
      this.fetchData();
    },
  },
  methods: {
    async fetchData() {
      const { data } = await api.get(`/scripts?q=${this.q}`);
      this.entities = data;
    },
    clearQuery() {
      console.log('clearQuery');
      this.q = '';
    },
  },
  created() {
    this.fetchData();
  },
};
</script>
