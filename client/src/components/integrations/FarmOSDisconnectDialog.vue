<template>
  <v-dialog v-model="show" max-width="500" max-height="1000" @input="(v) => v || (selectedGroups = [])">
    <v-card class="pa-4">
      <v-card-title class="headline"> Manage Groups </v-card-title>
      <v-card-text>
        Update Groups with Access to Farm Instance
        <br />
        <v-autocomplete
          label="Select Groups"
          multiple
          chips
          :items="allGroups"
          :item-text="(g) => `${g.name} (${g.path})`"
          :item-value="(g) => `${g._id}`"
          class="mt-4"
          v-model="selectedGroups"
          dense
          open-on-clear
        />
        <v-btn block @click="updateGroups" color="primary">Update Groups</v-btn>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  emits: ['updateGroups'],
  props: ['updateFarmInstanceName', 'allGroups', 'selectedGroupIds', 'value'],
  data() {
    return {
      selectedGroups: [],
    };
  },
  methods: {
    updateGroups() {
      this.$emit('updateGroups', [this.updateFarmInstanceName, this.selectedGroups]);
      this.selectedGroups = [];
    },
  },
  watch: {
    allGroups() {
      this.selectedGroups = [this.selectedGroupIds];
    },
    selectedGroupIds() {
      this.selectedGroups = this.selectedGroupIds;
    },
  },
  computed: {
    show: {
      get() {
        return this.value;
      },
      set(value) {
        this.$emit('input', value);
      },
    },
  },
};
</script>
