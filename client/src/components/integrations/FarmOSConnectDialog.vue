<template>
  <v-dialog v-model="show" max-width="400" max-height="1000" @input="(v) => v || (selectedFarms = [])">
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
        <v-btn block @click="connect" :disabled="selectedFarms.length <= 0" color="primary"
          >Connect selected Farms</v-btn
        >
      </v-card-text>

      <template v-if="allowCreate">
        <v-card-title class="headline"> Connect New Farm </v-card-title>

        <v-card-text>
          Add a new farm to the member's profile.
          <br />
          <v-btn block class="mt-4" color="primary" @click="$emit('create')">Create Farm</v-btn>
        </v-card-text>
      </template>

      <v-card-text class="text-center primary--text" @click="$emit('addExisting')" style="cursor: pointer">
        or add existing farmOS instance
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import { ref, computed, emits } from '@vue/composition-api';

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
  setup(props, { emit }) {
    const selectedFarms = ref([]);

    const connect = () => {
      emit('connect', [...selectedFarms.value]);
      selectedFarms.value = [];
    };

    return {
      selectedFarms,
      connect,
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
