<template>
  <a-dialog
    :modelValue="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="400"
    max-height="1000">
    <a-card class="pa-4">
      <a-card-title class="headline"> Connect Existing Farm </a-card-title>
      <a-card-text>
        Select Farm from this Member's profile to include in this group.

        <br />
        <a-select
          label="Select Farms"
          multiple
          chips
          closable-chips
          :items="farmInstances"
          :item-title="(i) => `${i.instanceName}`"
          class="mt-4"
          v-model="selectedFarms"
          prependItemSlot
          chipSlot
          itemSlot>
          <template v-slot:chip="{ props, item }">
            <v-chip v-bind="props">{{ item.raw.instanceName }}</v-chip>
          </template>

          <template v-slot:prepend-item>
            <a-btn
              @click="connect"
              :loading="loadingOwners"
              :disabled="selectedFarms.length <= 0"
              color="primary"
              class="button--autocomplete">
              Connect selected Farms
            </a-btn>
          </template>

          <template v-slot:item="{ props, item }">
            <a-list-item v-bind="props">
              <a-list-item-title>{{ item.instanceName }}</a-list-item-title>
              <a-list-item-subtitle v-if="item.raw.owners.length > 0" class="d-flex justify-end"
                >owner(s):</a-list-item-subtitle
              >
              <a-list-item-subtitle class="d-flex justify-end" v-for="owner in item.raw.owners" :key="owner.email">
                {{ owner.name }}({{ owner.email }})
              </a-list-item-subtitle>
            </a-list-item>
          </template>
        </a-select>
        <a-btn block @click="connect" :loading="loadingOwners" :disabled="selectedFarms.length <= 0" color="primary">
          Connect selected Farms
        </a-btn>
      </a-card-text>

      <template v-if="allowCreate">
        <a-card-title class="headline"> Connect New Farm </a-card-title>

        <a-card-text>
          Add a new farm to the member's profile.
          <br />
          <a-btn block class="mt-4" color="primary" @click="$emit('create')">Create Farm</a-btn>
        </a-card-text>
      </template>

      <a-card-text class="text-center text-grey" @click="$emit('addExisting')" disabled>
        or add existing farmOS instance (currently in development)
      </a-card-text>
    </a-card>
  </a-dialog>
</template>

<script>
import { ref } from 'vue';
import './css/button.css';

export default {
  props: {
    modelValue: Boolean,
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
  emits: ['connect', 'addExisting', 'create', 'update:modelValue'],
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
};
</script>
