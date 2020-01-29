<template>
  <v-container>
    <h1>Browse Surveys</h1>
    <v-card>
      <div
        v-for="e in entities"
        :key="e._id"
      >
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>{{e.name}}</v-list-item-title>
            <v-list-item-subtitle>{{e._id}}</v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-icon class="center-items">
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

export default {
  data() {
    return {
      entities: [],
    };
  },
  async created() {
    const { data } = await api.get('/surveys');
    this.entities = data;
    // this.entities = data;
  },
};
</script>

<style scoped>
.center-items {
  vertical-align: center;
}
</style>
