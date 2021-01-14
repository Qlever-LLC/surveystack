export default {
  beforeDestroy() {
    this.$store.dispatch('appui/reset');
  },
  methods: {
    setNavbarContent({ title, subtitle }) {
      this.$store.dispatch('appui/setTitle', title);
      this.$store.dispatch('appui/setSubtitle', subtitle);
    },
    getSurveys() {

    },
  },
};
