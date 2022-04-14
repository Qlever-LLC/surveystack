<template>
  <v-container>
    <div class="d-flex justify-space-between align-center ma-4">
      <h1>Manage FarmOS Aggregator Instances</h1>

      <v-progress-circular
        v-if="loading"
        indeterminate
        color="primary"
        class="my-8 align-center mt-6"
      ></v-progress-circular>
    </div>

    <v-autocomplete
      outlined
      primary
      label="Select Instace from Aggregator"
      v-model="selectedInstance"
      v-if="!loading && !!mappings"
      item-text="url"
      item-value="url"
      :items="mappings.aggregatorFarms"
    ></v-autocomplete>

    <div class="d-flex flex-column mt-2" v-if="!!selectedInstance">
      <v-label>Tags for instance on FarmOS Aggregator</v-label>
      <div class="d-flex mt-4">
        <v-chip v-for="(tag, idx) in tags" :key="`tag-${idx}`" green>{{ tag }}</v-chip>
        <v-chip v-if="tags.length === 0" color="secondary">No Tags associated with instance</v-chip>
      </div>
    </div>

    <template v-if="!!selectedInstance">
      <v-divider class="my-4"></v-divider>
      <h2>
        Surveystack Mappings for
        <v-chip>{{ selectedInstance }}</v-chip>
      </h2>

      <div class="v-flex my-2">
        <v-autocomplete
          outlined
          primary
          label="Select Group"
          v-model="selectedGroup"
          item-text="name"
          item-value="_id"
          :items="groups"
        ></v-autocomplete>
        <v-btn :disabled="!selectedGroup" color="primary" @click="$emit('map-group', selectedGroup, selectedInstance)"
          >Map Selected Aggregator Instance to Group in Surveystack</v-btn
        >
      </div>

      <v-label class="vy-4">Current Mappings</v-label>

      <v-simple-table v-if="mappedGroups.length > 0">
        <template v-slot:default>
          <thead>
            <tr>
              <th class="text-left">Group Name</th>
              <th class="text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(group, idx) in mappedGroups" :key="`grp-${idx}`">
              <td>{{ group.name }}</td>
              <td>
                <v-btn color="red" @click="$emit('unmap-group', group._id)" dark>Unmap</v-btn>
              </td>
            </tr>
          </tbody>
        </template>
      </v-simple-table>
      <v-alert v-else class="mt-4" mode="fade" text type="warning"
        >No Mappings exist for {{ selectedInstance }}</v-alert
      >
    </template>
  </v-container>
</template>

<script>
export default {
  props: {
    groups: Array,
    mappings: Object,
    loading: Boolean,
  },
  data() {
    return {
      selectedInstance: null,
      selectedGroup: null,
      error: null,
      success: null,
    };
  },
  computed: {
    selectedInstanceInfo() {
      return this.mappings.aggregatorFarms.find((e) => e.url === this.selectedInstance);
    },
    tags() {
      if (this.selectedInstanceInfo.tags == '') {
        return [];
      }
      return this.selectedInstanceInfo.tags.split(' ');
    },
    mappedGroups() {
      if (!this.selectedInstance) {
        return [];
      }

      console.dir(this.mappings.surveystackFarms);
      console.dir(this.groups);
      return this.mappings.surveystackFarms
        .filter((farm) => farm.instanceName === this.selectedInstance)
        .map((farm) => {
          return this.groups.find((g) => g._id === farm.groupId);
        });
    },
  },
};
</script>
