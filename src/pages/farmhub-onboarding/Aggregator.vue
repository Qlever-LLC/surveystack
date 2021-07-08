<template>
  <v-flex>
    <v-form class="mt-3" @keydown.enter.prevent="submit">
      <v-text-field v-model="aggregator.name" label="Name" placeholder="Name" outlined />

      <v-text-field v-model="aggregator.data.url" label="URL" placeholder="Aggregator URL" outlined />

      <v-text-field v-model="aggregator.data.apiKey" label="API Key" placeholder="Aggregator Key" outlined />

      <v-combobox
        item-color="primary"
        label="Tags"
        placeholder="Enter Aggregator Tags"
        outlined
        v-model="params"
        chips
        deletable-chips
        multiple
      >
      </v-combobox>

      <v-card outlined class="px-4 mb-4">
        <v-card-title>FarmOS Plan</v-card-title>

        <v-card-subtitle
          >Optional: Allows to create new FarmOS instances and add them to the Aggregator</v-card-subtitle
        >

        <v-card-text>
          <v-text-field v-model="aggregator.data.planName" label="Plan Name" placeholder="" outlined />

          <v-text-field v-model="aggregator.data.planKey" label="Plan Key" placeholder="" outlined />
        </v-card-text>
      </v-card>

      <v-btn class="mx-2" color="primary" @click="save" :loading="busy" :disabled="busy">Save Changes</v-btn>
      <v-btn :loading="busy" :disabled="busy" class="mx-2" color="primary" @click="testConnection"
        >Test Connection</v-btn
      >

      <v-btn v-if="false" outlined :loading="busy" :disabled="busy" class="mx-2" color="red" @click="testConnection">
        <v-icon left>mdi-delete</v-icon>Delete
      </v-btn>
    </v-form>
  </v-flex>
</template>

<script>
export default {
  data() {
    return {
      params: [],
    };
  },
  props: ['aggregator', 'busy'],
  methods: {
    save() {
      this.aggregator.data.parameters = this.params.join(',');
      this.$emit('save', this.aggregator);
    },
    testConnection() {
      this.$emit('testConnection', this.aggregator);
    },
    delete() {
      this.$emit('delete', this.aggregator);
    },
    mapTags() {
      const p = this.aggregator.data.parameters;
      if (!p) {
        this.params = [];
      } else {
        this.params = p.split(',');
      }
    },
  },
  mounted() {
    this.mapTags();
  },
  watch: {
    aggregator() {
      this.mapTags();
    },
  },
};
</script>
