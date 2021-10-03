<template>
  <v-container>
    <v-text-field label="Search" v-model="q" append-icon="mdi-magnify" clearable />
    <app-entity-list :entities="entities" collection="scripts" />
    <div v-if="entities.length < 1" class="py-12 text-center">
      {{ loadingError ? 'There was an error, please refresh the page' : 'No scripts available' }}
    </div>
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
      loadingError: false,
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
      try {
        const { data } = await api.get(`/scripts?q=${this.q}`);
        this.entities = data;
        this.loadingError = false;
      } catch {
        this.loadingError = true;
      }
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
