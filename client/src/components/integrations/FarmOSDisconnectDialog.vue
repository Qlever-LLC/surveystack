<template>
  <v-dialog persistent v-model="show" max-width="500" max-height="1000" @input="(v) => v || (selectedGroups = [])">
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
        >
          <template slot="prepend-item">
            <v-btn
              :disabled="loading"
              :loading="loading"
              @click="updateGroups"
              color="primary"
              class="button--autocomplete"
            >
              Update Groups
            </v-btn>
          </template>
        </v-autocomplete>
        <div class="d-flex justify-space-around">
          <v-btn :disabled="loading" :loading="loading" @click="cancelUpdate" color="error">Cancel</v-btn>
          <v-btn :disabled="loading" :loading="loading" @click="updateGroups" color="primary"> Update Groups </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import './css/button.css';

export default {
  emits: ['updateGroups', 'cancelUpdate'],
  props: ['loading', 'updateFarmInstanceName', 'allGroups', 'selectedGroupIds', 'value'],
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
    cancelUpdate() {
      this.$emit('cancelUpdate');
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
