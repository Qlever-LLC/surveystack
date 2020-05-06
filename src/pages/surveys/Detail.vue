<template>
  <v-container
    v-if="entity"
    class="mt-2"
  >
    <div class="d-flex justify-end">
      <v-btn
        v-if="editable"
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

    <h1>{{entity.name}}</h1>
    <div v-if="surveyInfo">
      {{surveyInfo.submissions}} {{surveyInfo.submissions === 1 ? 'submission' : 'submissions'}}
      <div
        v-if="surveyInfo.latestSubmission"
        class="text--secondary"
      >Latest submission on {{surveyInfo.latestSubmission.dateModified}}</div>
    </div>

    <div class="mt-4">
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
      surveyInfo: null,
    };
  },
  methods: {
    startDraft(survey) {
      const group = this.$store.getters['memberships/activeGroup'];
      this.$store.dispatch('submissions/startDraft', { survey, group });
    },
  },
  computed: {
    user() {
      return this.$store.getters['auth/user'];
    },
    memberships() {
      return this.$store.getters['memberships/memberships'];
    },
    editable() {
      if (!this.$store.getters['auth/isLoggedIn']) {
        return false;
      }
      const user = this.$store.getters['auth/user'];

      if (this.entity && this.entity.meta && this.entity.meta.creator === user._id) {
        return true;
      }

      if (!this.entity.meta.group || !this.entity.meta.group.id) {
        return false;
      }

      console.log('entity', this.entity);
      const g = this.memberships.find(m => m.group._id === this.entity.meta.group.id);
      if (g && g.role === 'admin') {
        return true;
      }
      return false;
    },
  },
  async created() {
    const { id } = this.$route.params;
    const s = await api.get(`/surveys/${id}`);
    this.entity = s.data;

    const i = await api.get(`/surveys/info?id=${id}`);
    this.surveyInfo = i.data;

    const user = this.$store.getters['auth/user'];
    this.$store.dispatch('memberships/getUserMemberships', user._id);
  },

};
</script>
