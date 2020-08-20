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

    <transition name="fade">
      <app-feedback
        v-if="status"
        class="mt-5"
        @closed="status = ''"
      >{{status}}</app-feedback>
    </transition>
  </v-container>
</template>

<script>
import api from '@/services/api.service';
import * as db from '@/store/db';
import appFeedback from '@/components/ui/Feedback.vue';


export default {
  components: {
    appFeedback,
  },
  data() {
    return {
      activate: false,
      status: '',
    };
  },
  methods: {
    clearAll() {
      try {
        db.clearAllSubmissions();
      } catch (error) {
        console.log(error);
      }

      try {
        db.clearAllSurveys();
      } catch (error) {
        console.log(error);
      }
    },
    async submit() {
      try {
        await api.post('/debug/tabularasa');
      } catch (error) {
        this.status = error.response.data.message;
        return;
      }

      db.openDb(this.clearAll);

      this.$router.push('/surveys/browse');
    },
  },
};
</script>
