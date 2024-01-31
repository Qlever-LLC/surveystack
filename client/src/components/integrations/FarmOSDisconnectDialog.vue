<template>
  <a-dialog persistent :modelValue="modelValue" max-width="500" max-height="1000" @update:modelValue="cancelUpdate">
    <a-card class="pa-4">
      <a-card-title class="headline"> Manage Groups </a-card-title>
      <a-card-text>
        Update Groups with Access to Farm Instance
        <br />
        <a-select
          label="Select Groups"
          multiple
          chips
          :items="allGroups"
          :item-title="(g) => `${g.name} (${g.path})`"
          :item-value="(g) => `${g._id}`"
          class="mt-4"
          v-model="selectedGroups"
          dense
          open-on-clear
          chipSlot
          prependItemSlot>
          <template v-slot:chip="{ props, item }">
            <a-chip v-bind="props" closable>
              {{ item.title }}
            </a-chip>
          </template>
          <template v-slot:prepend-item>
            <a-btn
              :disabled="loading"
              :loading="loading"
              @click="updateGroups"
              color="primary"
              class="button--autocomplete">
              Update Groups
            </a-btn>
          </template>
        </a-select>
        <div class="d-flex justify-space-around">
          <a-btn :disabled="loading" :loading="loading" @click="cancelUpdate" color="error">Cancel</a-btn>
          <a-btn :disabled="loading" :loading="loading" @click="updateGroups" color="primary"> Update Groups </a-btn>
        </div>
      </a-card-text>
    </a-card>
  </a-dialog>
</template>

<script>
import './css/button.css';

export default {
  emits: ['updateGroups', 'cancelUpdate', 'update:modelValue'],
  props: ['loading', 'updateFarmInstanceName', 'allGroups', 'selectedGroupIds', 'modelValue'],
  data() {
    return {
      selectedGroups: [],
    };
  },
  methods: {
    updateGroups() {
      // emit instance, initial selected group Ids and selected group Ids before clicking update
      this.$emit('updateGroups', [this.updateFarmInstanceName, this.selectedGroupIds, this.selectedGroups]);
      this.selectedGroups = [];
      this.$emit('update:modelValue', false);
    },
    cancelUpdate() {
      this.$emit('cancelUpdate');
      this.$emit('update:modelValue', false);
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
};
</script>
