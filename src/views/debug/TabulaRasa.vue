<template>
  <v-container>
    <h1>Tabula Rasa</h1>
    <p>This will clear all surveys and all submissions. And furthermore create an example survey with corresponding submissions.</p>
    <v-checkbox
      label="Activate"
      v-model="activate"
    />

    <v-btn
      color="primary"
      @click="submit"
      :disabled="!activate"
    >{{activate ? "CONFIRM!" : "Activate first"}}</v-btn>
  </v-container>
</template>

<script>
import api from '@/services/api.service';
import * as db from '@/store/db';

export default {
  data() {
    return {
      activate: false,
    };
  },
  methods: {
    async submit() {
      await api.post('/debug/tabularasa');
      this.$router.push('/surveys/browse');

      try {
        db.clearAllSurveyResults();
      } catch (error) {
        console.log(error);
      }

      try {
        db.clearAllSurveys();
      } catch (error) {
        console.log(error);
      }
    },
  },
};
</script>
