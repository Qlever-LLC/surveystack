<template>
  <v-dialog v-model="show" max-width="500" max-height="1000" @input="(v) => v || (selectedGroups = [])">
    <v-card class="pa-4">
      <v-card-title class="headline"> Manage Groups </v-card-title>
      <v-card-text>
        Update Groups with Access to Farm Instance
        <br />
        <v-autocomplete label="Select Groups" multiple deletable-chips chips :items="groupsOfInstance"
          :item-text="(g) => `${g.name}`" :item-value="(g) => `${g.groupId}`" class="mt-4" v-model="selectedGroups" />
        <v-btn block @click="updateGroups" :disabled="selectedGroups.length <= 0" color="primary">Update Groups</v-btn>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  emits: ['updateGroups'],
  props: ['disconnectFarmInstanceName', 'groupsOfInstance', 'allGroupIds', 'value'],
  data() {
    return {
      selectedGroups: [],
    };
  },
  methods: {
    updateGroups() {
      this.$emit('updateGroups', [this.disconnectFarmInstanceName, this.selectedGroups]);
      this.selectedGroups = [];
    },
  },
  watch: {
    groupsOfInstance() {
      this.selectedGroups = [this.allGroupIds];
    },
    allGroupIds() {
      this.selectedGroups = this.allGroupIds;
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
