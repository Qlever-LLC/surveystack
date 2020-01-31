<template>
  <v-container>
    <v-card>
      <div
        v-for="e in entities"
        :key="e._id"
      >
        <v-list-item>
          <v-list-item-content>

            <v-list-item-title>{{e.name}}</v-list-item-title>
            <v-list-item-subtitle>{{e._id}}</v-list-item-subtitle>
            <small class="grey--text">Version {{e.latestVersion}}</small>
          </v-list-item-content>
          <v-list-item-action class="d-flex flex-row align-center">
            <v-btn
              class="mx-2"
              outlined
              :to="`/submissions?survey=${e._id}`"
              text
            >
              <v-icon>mdi-eye</v-icon>
              <span class="d-none d-lg-inline ml-1">Submission</span>
            </v-btn>
            <v-btn
              class="mx-2"
              outlined
              :to="`/surveys/${e._id}/edit`"
              text
            >
              <v-icon>mdi-pencil</v-icon>
              <span class="d-none d-lg-inline ml-1">Edit</span>
            </v-btn>
            <v-btn
              class="mx-2"
              outlined
              :to="`/submissions/drafts/new?survey=${e._id}`"
            >
              <v-icon>mdi-file-document-box-plus-outline</v-icon>
              <span class="d-none d-lg-inline ml-1">New Draft</span>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
        <v-divider />
      </div>
    </v-card>
  </v-container>
</template>

<script>
import api from '@/services/api.service';
import * as db from '@/store/db';

export default {
  data() {
    return {
      entities: [],
    };
  },
  beforeDestroy() {
    this.$store.dispatch('appui/reset');
  },
  updated() {
    this.$store.dispatch('appui/setTitle', 'Browse Surveys');
  },
  async created() {
    let data = {};

    try {
      // eslint-disable-next-line prefer-destructuring
      data = (await api.get('/surveys')).data;
    } catch (error) {
      console.log('using cached data');
      data = (await new Promise((resolve) => {
        db.getAllSurveys(surveys => resolve(surveys));
      }));
    }


    this.entities = data;
    db.openDb(() => {
      // TODO, this is not necessary if pulling cached data in the first place
      data.forEach((d) => {
        db.persistSurvey(d);
      });
    });
    // this.entities = data;
  },
};
</script>

<style scoped>
.center-items {
  vertical-align: center;
}
</style>
