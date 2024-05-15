<template>
  <a-container>
    <h1>Tabula Rasa</h1>
    <p>
      This will clear all surveys and all responses. And furthermore create an example survey with corresponding
      responses.
    </p>
    <a-checkbox label="Activate" v-model="activate" />

    <a-btn color="primary" @click="submit" :disabled="!activate">{{ activate ? 'CONFIRM!' : 'Activate first' }}</a-btn>

    <transition name="fade">
      <app-feedback v-if="status" class="mt-5" @closed="status = ''">{{ status }}</app-feedback>
    </transition>
  </a-container>
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
    async clearAll() {
      try {
        await db.clearAllSubmissions();
      } catch (error) {
        console.log(error);
      }

      try {
        await db.clearAllSurveys();
      } catch (error) {
        console.log(error);
      }

      try {
        await db.clearAllResources();
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

      await this.clearAll();

      this.$router.push(this.$route.path + '/surveys');
    },
  },
};
</script>
