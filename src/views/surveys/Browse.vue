<template>
  <v-container>
    <v-card>
      <div
        v-for="e in entities"
        :key="e._id"
      >
        <v-list-item two-line>
          <v-list-item-content>
            <v-list-item-title>{{e.name}}</v-list-item-title>
            <v-list-item-subtitle>{{e._id}}</v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-icon>
            <v-btn
              class="mx-2"
              outlined
              :to="`/submissions?survey=${e._id}`"
              text
            >
              <v-icon left>mdi-eye</v-icon>Submission
            </v-btn>
            <v-btn
              class="mx-2"
              outlined
              :to="`/surveys/${e._id}/edit`"
              text
            >
              <v-icon left>mdi-pencil</v-icon> Edit
            </v-btn>
            <v-btn
              class="mx-2"
              outlined
              :to="`/submissions/drafts/new?survey=${e._id}`"
            >
              New Draft
            </v-btn>
          </v-list-item-icon>
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
    this.$store.dispatch('appui/title', 'Browse Surveys');
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
