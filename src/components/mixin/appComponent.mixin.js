export default {
  beforeDestroy() {
    this.$store.dispatch('appui/reset');
  },
  comuted: {
    appSurveys() {
      return this.$store.state.surveys.surveys;
    },
    appSubmissions() {
      return this.$store.state.submissions.submissions;
    },
  },
  methods: {
    // fetchSubmission(draftId) {
    //   this.$store.dispatch('submissions/getSubmission', draftId);
    // },
    setNavbarContent({ title, subtitle }) {
      this.$store.dispatch('appui/setTitle', title);
      this.$store.dispatch('appui/setSubtitle', subtitle);
    },
    getSurveys() {

    },
  },
};
