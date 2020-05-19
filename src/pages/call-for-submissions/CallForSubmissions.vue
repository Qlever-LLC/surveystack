<template>
  <v-container>
    <h1>Call for Submissions</h1>
    <app-survey-selector
      :searchResults="searchResults"
      @search="searchSurveys"
    />
    <v-data-table
      v-model="selectedMembers"
      :items="activeMembers"
      :headers="headers"
      disable-pagination
      hide-default-footer
      show-select
      item-key="_id"
    />

    Members selected {{selectedMembers.length}}

  </v-container>
</template>

<script>
import appSurveySelector from '@/components/survey/SurveySelector.vue';

import api from '@/services/api.service';


export default {
  components: {
    appSurveySelector,
  },
  data() {
    return {
      members: [],
      group: null,
      selectedMembers: [],
      searchResults: [],
      headers: [
        { text: 'id', value: '_id' },
        { text: 'name', value: 'user.name' },
        { text: 'email', value: 'user.email' },
      ],
    };
  },
  methods: {
    async searchSurveys(q) {
      console.log('calling searchSurveys', q);
      const { data: searchResults } = await api.get(`/surveys?projections[]=name&projections[]=meta.dateModified&q=${q}`);
      this.searchResults = searchResults;
    },
  },
  computed: {
    activeMembers() {
      return this.members.filter(member => member.meta.status === 'active');
    },
  },
  async created() {
    const { group } = this.$route.query;
    if (group) {
      this.group = group;
      const { data: members } = await api.get(`/memberships?group=${this.group}&populate=true`);
      this.members = members;
    }
  },
};
</script>
