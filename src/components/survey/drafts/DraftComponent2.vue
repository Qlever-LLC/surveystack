<template>
  <v-container>
    <h2>Survey</h2>
    {{survey}}
    <h2>Submission</h2>
    {{submission}}
    <h2>Controls</h2>
    <v-text-field v-model="name" />
  </v-container>
</template>

<script>
export default {
  props: {
    survey: { type: Object },
    submission: { type: Object },
  },
  computed: {
    name: {
      get() {
        return this.$store.getters['draft/property']('data.text_1.value');
      },
      set(v) {
        this.$store.dispatch('draft/setProperty', { key: 'data.text_1.value', value: v });
      },

    },
  },
  created() {
    const { survey, submission } = this;
    this.$store.dispatch('draft/init', { survey, submission });
  },
};
</script>
