<template>

  <v-card class="pa-4">
    <v-card-title>API Integrations</v-card-title>

    <div class="pa-4 api-border">
      <div class="d-flex">
        <v-text-field
          class="mr-12"
          label="Name"
          placeholder="Enter a Name"
          autocomplete="off"
          v-model="integrations[0].name"
        />

        <v-btn icon>
          <v-icon color="grey lighten-1">mdi-delete</v-icon>
        </v-btn>

      </div>

      <v-select
        :items="integrationTypes"
        :value="integrations[0].type"
        label="Type"
        outlined
      ></v-select>

      <v-text-field
        label="URL"
        placeholder="Enter the API URL"
        autocomplete="off"
        v-model="integrations[0].url"
      />

      <v-text-field
        label="API Key"
        placeholder="Enter the API Key"
        autocomplete="off"
        v-model="integrations[0].apiKey"
      />

      <v-text-field
        label="API Parameters"
        placeholder="Enter the API Parameters"
        autocomplete="off"
        v-model="integrations[0].parameters"
      />
    </div>

    <v-divider class="mt-4 mb-4"></v-divider>
    <div class="d-flex justify-end pa-4">
      <v-btn color="primary">
        <v-icon left>mdi-plus-circle-outline</v-icon> Add Integration
      </v-btn>
    </div>

  </v-card>
</template>

<script>

const integrations = {
  integrationTypes: [
    {
      value: 'farmos-aggregator',
      text: 'FarmOS Aggregator',
    },
    {
      value: 'generic',
      text: 'Generic',
    },
  ],
  integrations: [{
    type: 'farmos-aggregator',
    name: 'FarmOS Aggregator RFC',
    url: 'oursci.farmos.group',
    apiKey: '1234',
    parameters: 'rfc,nofa',
  }],
};

export default {
  data() {
    return {
      integrationTypes: [],
      integrations: [],
    };
  },
  methods: {
    addIntegration() {

    },
    cancel() {

    },
  },
  created() {
    // fake integrations
    this.integrationTypes = integrations.integrationTypes;
    this.integrations = integrations.integrations;
  },
};
</script>
