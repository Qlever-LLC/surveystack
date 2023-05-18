<template>
  <v-card class="draft-card">
    <v-list-item>
      <v-list-item-content>
        <v-list-item-title>{{ `${submission._id}, ${submission.meta.survey.id}` }}</v-list-item-title>
      </v-list-item-content>
    </v-list-item>
  </v-card>
</template>

<script>
export default {
  props: {
    submission: {
      type: Object,
      required: true,
    },
  },
};
</script>

<style scoped>
.draft-card {
  margin-top: 12px;
}
</style>
