<template>
  <a-dialog v-model="show" max-width="400" max-height="1000" @input="(v) => v || (selectedFarms = [])">
    <a-card class="pa-4">
      <a-card-title class="headline"> Connect Existing Farm </a-card-title>
      <a-card-text>
        Select Farm from this Member's profile to include in this group.

        <br />
        <a-select
          engineering="autocomplete"
          label="Select Farms"
          multiple
          chips
          deletable-chips
          :items="farmInstances"
          :item-text="(i) => `${i.instanceName}`"
          class="mt-4"
          v-model="selectedFarms"
          prependItemSlot
          itemSlot
        >
          <template slot="prepend-item">
            <v-btn
              @click="connect"
              :loading="loadingOwners"
              :disabled="selectedFarms.length <= 0"
              color="primary"
              class="button--autocomplete"
            >
              Connect selected Farms
            </v-btn>
          </template>

          <template v-slot:item="{ item }">
            <v-list-item-content style="width: min-content">
              <a-list-item-title>{{ item.instanceName }}</a-list-item-title>
              <a-list-item-subtitle v-if="item.owners.length > 0" class="d-flex justify-end"
                >owner(s):</a-list-item-subtitle
              >
              <a-list-item-subtitle class="d-flex justify-end" v-for="owner in item.owners" :key="owner.email">
                {{ owner.name }}({{ owner.email }})
              </a-list-item-subtitle>
            </v-list-item-content>
          </template>
        </a-select>
        <v-btn block @click="connect" :loading="loadingOwners" :disabled="selectedFarms.length <= 0" color="primary">
          Connect selected Farms
        </v-btn>
      </a-card-text>

      <template v-if="allowCreate">
        <a-card-title class="headline"> Connect New Farm </a-card-title>

        <a-card-text>
          Add a new farm to the member's profile.
          <br />
          <v-btn block class="mt-4" color="primary" @click="$emit('create')">Create Farm</v-btn>
        </a-card-text>
      </template>

      <a-card-text class="text-center grey--text" @click="$emit('addExisting')" disabled>
        or add existing farmOS instance (currently in development)
      </a-card-text>
    </a-card>
  </a-dialog>
</template>

<script>
import { ref } from '@vue/composition-api';
import './css/button.css';
import ADialog from '@/components/ui/ADialog.vue';

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
    loadingOwners: {
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
