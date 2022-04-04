<template>
  <v-container>
    <v-alert v-if="success" class="mt-4" mode="fade" text type="success" @click="success = null">{{ success }}</v-alert>

    <div class="d-flex justify-space-between align-center ma-4">
      <h1>Manage Groups</h1>

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
      label="Select Group"
      v-model="selectedGroup"
      v-if="!loading && !!groups"
      item-text="name"
      item-value="_id"
      :items="groups"
    ></v-autocomplete>

    <v-divider class="my-4"></v-divider>

    <v-simple-table v-if="!loading">
      <template v-slot:default>
        <thead>
          <tr>
            <th class="text-left">Instance Name</th>
            <th class="text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(instance, idx) in mappedInstances" :key="`grp-${idx}`">
            <td>{{ instance.instanceName }}</td>
            <td>
              <v-btn color="red" @click="$emit('unmap-group', selectedGroup, instance.instanceName)" dark>Unmap</v-btn>
            </td>
          </tr>

          <tr>
            <td>
              <v-autocomplete
                class="mt-6"
                outlined
                primary
                label="Select FarmOS Instance"
                v-model="selectedInstance"
                v-if="!loading && !!mappings"
                item-value="instanceName"
                item-text="instanceName"
                :items="instances"
              ></v-autocomplete>
            </td>
            <td>
              <v-btn color="primary" @click="$emit('map-group', selectedGroup, selectedInstance)">Map</v-btn>
            </td>
          </tr>
        </tbody>
      </template>
    </v-simple-table>
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
      selectedGroup: null,
      selectedInstance: null,
      error: null,
      success: null,
    };
  },
  computed: {
    mappedInstances() {
      if (!this.selectedGroup) {
        return [];
      }

      return this.mappings.surveystackFarms
        .filter((farm) => farm.groupId === this.selectedGroup)
        .map((farm) => ({
          instanceName: farm.instanceName,
        }));
    },
    instances() {
      return this.mappings.aggregatorFarms.map((farm) => ({
        instanceName: farm.url,
      }));
    },
  },
};
</script>
