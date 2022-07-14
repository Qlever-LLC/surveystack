<template>
  <v-dialog v-model="show" max-width="400" max-height="1000">
    <v-card class="pa-4">
      <v-card-title class="headline"> Connect Existing Farm </v-card-title>
      <v-card-text>
        Select Farm from this Member's profile to include in this group.

        <br />
        <v-autocomplete
          label="Select Farms"
          multiple
          chips
          deletable-chips
          :items="farmInstances"
          class="mt-4"
          v-model="selectedFarms"
        />
        <v-btn block @click="$emit('connect', selectedFarms)" :disabled="selectedFarms.length <= 0" color="primary"
          >Connect selected Farms</v-btn
        >
      </v-card-text>

      <v-card-title class="headline"> Connect New Farm </v-card-title>

      <v-card-text>
        Add a new farm to the member's profile.
        <br />
        <v-btn block class="mt-4" color="primary">Create Farm</v-btn>
      </v-card-text>

      <v-card-text class="text-center primary--text" @click="$emit('addExisting')" style="cursor: pointer">
        or add existing farmOS instance
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import { ref, computed } from '@vue/composition-api';

export default {
  emits: ['connect', 'addExisting', 'create'],
  props: {
    value: Boolean,
    farmInstances: {
      type: Array,
      required: true,
    },
    allowCreate: {
      type: Boolean,
      required: true,
    },
  },
  setup(props) {
    const selectedFarms = ref([]);

    console.log(props.farmInstances);

    return {
      selectedFarms,
    };
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
