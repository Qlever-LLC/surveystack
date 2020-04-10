<template>
  <v-container>
    <v-text-field
      v-model="search"
      label="Search"
      append-icon="mdi-magnify"
    />
    <div class="d-flex justify-end"><small class="text--secondary">{{surveys.pagination.total}} results</small></div>
    <h1>Active Group here</h1>
    <v-card>
      <div
        v-for="e in surveys.content"
        :key="e._id"
      >
        <v-list-item :to="`/surveys/${e._id}`">
          <v-list-item-content>

            <v-list-item-title>{{e.name}}</v-list-item-title>
            <v-list-item-subtitle>{{e._id}}</v-list-item-subtitle>
            <small class="grey--text">Version {{e.latestVersion}}</small>
          </v-list-item-content>

        </v-list-item>
        <v-divider />
      </div>
    </v-card>
    <v-row>
      <v-spacer />
      <v-btn
        outlined
        class="ma-8"
      >Show Others</v-btn>
    </v-row>
  </v-container>
</template>

<script>
import api from '@/services/api.service';

export default {
  data() {
    return {
      search: '',
      surveys: {
        content: [],
        pagination: {
          total: 0,
          skip: 0,
          limit: 100000,
        },
      },
    };
  },
  watch: {
    search() {
      this.fetchData();
    },
  },
  methods: {
    async fetchData() {
      //  TODO create two lists, filter by active group and others
      try {
        const { data } = await api.get(`/surveys/page?q=${this.search}`);
        this.surveys = data;
      } catch (e) {
        // TODO: use cached data?
        console.log('something went wrong:', e);
      }
    },
  },
  async created() {
    await this.fetchData();
  },
};
</script>
