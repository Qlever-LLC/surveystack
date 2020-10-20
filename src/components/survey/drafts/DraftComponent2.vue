<template>
  <v-container class="mt-12">
    <v-row class="mt-6">
      <v-col>
        <v-textarea
          :value="submissionStringified"
          label="submission"
          rows="30"
          outlined
        />
      </v-col>
      <v-col>
        <v-text-field
          v-model="name"
          label="data.text_1.value"
        />
        <v-text-field
          v-model="age"
          label="data.number_2.value"
        />
      </v-col>
    </v-row>

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
    submissionStringified() {
      return JSON.stringify(this.submission, null, 2);
    },
    age: {
      get() {
        return this.$store.getters['draft/property']('data.number_2.value');
      },
      set(v) {
        const number = Number(v) || null;
        this.$store.dispatch('draft/setProperty', { key: 'data.number_2.value', value: number });
      },
    },
  },
  created() {
    const { survey, submission } = this;
    this.$store.dispatch('draft/init', { survey, submission });
  },
};
</script>
