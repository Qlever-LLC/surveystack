<template>
  <a-dialog persistent v-model="show" max-width="500" max-height="1000" @input="(v) => v || (selectedGroups = [])">
    <a-card class="pa-4">
      <a-card-title class="headline"> Manage Groups </a-card-title>
      <a-card-text>
        Update Groups with Access to Farm Instance
        <br />
        <a-select
          engineering="autocomplete"
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
          prependItemSlot
        >
          <template slot="prepend-item">
            <a-btn
              :disabled="loading"
              :loading="loading"
              @click="updateGroups"
              color="primary"
              class="button--autocomplete"
            >
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
import ABtn from '@/components/ui/ABtn.vue';

export default {
  components: { ABtn },
  emits: ['updateGroups', 'cancelUpdate'],
  props: ['loading', 'updateFarmInstanceName', 'allGroups', 'selectedGroupIds', 'value'],
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
