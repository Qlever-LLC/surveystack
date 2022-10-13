<template>
  <v-dialog v-model="show" max-width="500" max-height="1000" @input="(v) => v || (selectedGroups = [])">
    <v-card class="pa-4">
      <v-card-title class="headline"> Disconnect Farm from Groups </v-card-title>
      <v-card-text>
        Select Groups to disconnect this farm from.
        <br />
        <v-autocomplete
          label="Select Groups"
          multiple
          chips
          deletable-chips
          :items="groupsOfInstance"
          :item-text="(g) => `${g.name}`"
          :item-value="(g) => `${g.groupId}`"
          class="mt-4"
          v-model="selectedGroups"
        />
        <v-btn block @click="disconnect" :disabled="selectedGroups.length <= 0" color="primary"
          >Disconnect Selected Groups
        </v-btn>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  emits: ['disconnect'],
  props: ['disconnectFarmInstanceName', 'groupsOfInstance', 'disconnectGroupId', 'value'],
  data() {
    return {
      selectedGroups: [],
    };
  },
  methods: {
    disconnect() {
      this.$emit('disconnect', [this.disconnectFarmInstanceName, this.selectedGroups]);
      this.selectedGroups = [];
    },
  },
  watch: {
    groupsOfInstance() {
      this.selectedGroups = [this.disconnectGroupId];
    },
    disconnectGroupId() {
      this.selectedGroups = [this.disconnectGroupId];
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
