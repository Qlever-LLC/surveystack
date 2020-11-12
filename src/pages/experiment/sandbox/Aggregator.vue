<template>
  <v-flex>
    <v-form
      class="mt-3"
      @keydown.enter.prevent="submit"
    >
      <v-text-field
        v-model="aggregator.name"
        label="Name"
        placeholder="Name"
        outlined
      />

      <v-text-field
        v-model="aggregator.url"
        label="URL"
        placeholder="Aggregator URL"
        outlined
      />

      <v-text-field
        v-model="aggregator.apiKey"
        label="API Key"
        placeholder="Aggregator Key"
        outlined
      />

      <v-btn
        class="mx-2"
        color="primary"
        @click="save"
      >Save Changes</v-btn>
      <v-btn
        class="mx-2"
        color="primary"
        @click="testConnection"
      >Test Connection</v-btn>

    </v-form>
  </v-flex>
</template>

<script>
export default {
  props: [
    'aggregator',
  ],
  methods: {
    save() {
      this.$emit('save', this.aggregator);
    },
    testConnection() {
      this.$emit('testConnection', this.aggregator);
    },
  },
};
</script>
