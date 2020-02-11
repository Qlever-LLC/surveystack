<template>
  <v-container
    v-if="entity"
    style="height: calc(100% - 64px)"
    class="mt-2 d-flex flex-column justify-center"
  >
    <div class="d-flex justify-center">
      <v-btn
        class="mx-2"
        :to="`/surveys/${entity._id}/edit`"
      >
        <v-icon>mdi-pencil</v-icon>
        <span class="ml-2">Edit</span>
      </v-btn>
      <v-btn
        class="mx-2"
        :to="`/submissions?survey=${entity._id}`"
      >
        <v-icon>mdi-table</v-icon>
        <span class="ml-2">Results</span>
      </v-btn>

    </div>

    <div class="mt-4 d-flex justify-center">
      <span class="text-center">
        <h1>{{entity.name}}</h1>
        This is a good survey with 17 submissions.
      </span>
    </div>

    <div class="mt-4 d-flex justify-center">
      <v-btn
        x-large
        color="primary"
        @click="startDraft(entity._id)"
      >
        <v-icon>mdi-file-document-box-plus-outline</v-icon>
        <span class="ml-2">Start Survey</span>
      </v-btn>
    </div>
  </v-container>
</template>

<script>
import api from '@/services/api.service';

export default {
  data() {
    return {
      entity: null,
    };
  },
  methods: {
    startDraft(survey) {
      this.$store.dispatch('submissions/startDraft', { survey });
    },
  },
  async created() {
    const { id } = this.$route.params;
    const { data } = await api.get(`/surveys/${id}`);
    this.entity = data;
  },

};
</script>
