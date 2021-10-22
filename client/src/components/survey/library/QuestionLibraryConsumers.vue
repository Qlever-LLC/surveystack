<template>
  <v-card flat>
    <v-card-title>
      Surveys using this question set
    </v-card-title>
    <v-divider></v-divider>
    <v-card-text>
      <v-list dense style="max-height: 500px" class="overflow-y-auto">
        <v-list-item v-for="c in libraryConsumers" :key="c._id" @click="goToSurvey(c._id)">
          <v-list-item-content>
            <v-list-item-title>{{ c.name }}</v-list-item-title>
            <small class="grey--text">{{ c._id }}</small>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>
<script>
import api from '@/services/api.service';

export default {
  name: 'question-library-consumers',
  props: ['value'],
  data() {
    return {
      libraryConsumers: [],
    };
  },
  methods: {
    goToSurvey(survey_id) {
      let route = this.$router.resolve(`/surveys/${survey_id}`);
      window.open(route.href, '_blank');
    },
    async loadLibraryConsumers() {
      const response = await api.get(`/surveys/list-library-consumers?id=${this.value}`);
      this.libraryConsumers = response.data;
    },
  },
  created() {
    this.loadLibraryConsumers();
  },
};
</script>
<style scoped>
.survey-group-name-input >>> .v-input__slot ::before {
  border: none;
}

.survey-group-name-input >>> .v-input__control >>> .v-input__slot ::before {
  border: none;
}
</style>
