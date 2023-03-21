<template>
  <v-alert v-if="error" border="left" type="error"> {{ error }}</v-alert>
  <p v-else>Please wait while generating PDF file...</p>
</template>

<script>
import api from '@/services/api.service';
import SubmissionPDF from '@/utils/submissionPdf';
import get from 'lodash/get';

export default {
  data() {
    return {
      error: null,
    };
  },
  async created() {
    const { id } = this.$route.params;
    if (!id) {
      this.error = 'Sorry, no survey found or your URL is expired.';
      return;
    }
    try {
      const { data: submission } = await api.get(`/submissions/${id}?pure=1`);
      const surveyId = get(submission, 'meta.survey.id');
      const { data: survey } = await api.get(`/surveys/${surveyId}`);
      const pdf = await new SubmissionPDF(survey, submission).generate();
      pdf.open({}, window);
    } catch (e) {
      console.error(e);
      this.error = 'Oops! Sorry, something went wrong while generating a PDF.';
    }
  },
};
</script>
