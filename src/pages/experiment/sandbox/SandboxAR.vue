<template>
  <v-container>
    <h1>Test</h1>
    <v-row>
      <v-col>
        <v-textarea
          :value="submissionText"
          rows="30"
          outlined
        />
      </v-col>
      <v-col>
        <v-form>
          <v-text-field
            label="meta.user"
            @input="(v) => setProperty({path: 'meta.user', value: v})"
          />

          <v-text-field
            v-model="name"
            label="data.name.value"
          />
          <v-text-field
            v-model="age"
            label="data.age.value"
            type="number"
          />

        </v-form>
      </v-col>

    </v-row>

  </v-container>
</template>

<script>
export default {
  methods: {
    setProperty({ path, value }) {
      this.$store.dispatch('draft/setProperty', { path, value });
    },
  },
  computed: {
    submission() {
      return this.$store.getters['draft/submission'];
    },
    submissionText() {
      return JSON.stringify(this.submission, null, 2);
    },
    name: {
      get() {
        return this.$store.getters['draft/property']('data.name').value;
      },
      set(v) {
        this.setProperty({ path: 'data.name.value', value: v });
      },

    },
    age: {
      get() {
        return this.$store.getters['draft/property']('data.age').value;
      },
      set(v) {
        const n = Number(v);
        this.setProperty({ path: 'data.age.value', value: n });
      },
    },
    user: {
      get() {
        return this.$store.getters['draft/property']('meta.user').value;
      },
      set(v) {
        this.setProperty({ path: 'meta.user', value: v });
      },
    },
  },
  created() {
    const submission = { meta: { user: 'Andreas' }, data: { age: { value: 36 }, name: { value: 'Andreas' } } };
    this.$store.dispatch('draft/init', { submission });
  },
};
</script>
