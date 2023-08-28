<template>
  <div>
    <v-radio-group
      class="mt-0 pt-0"
      :value="value"
      @change="$emit('input', $event)"
      :name="name"
      :disabled="disabled"
      :hide-details="hideDetails"
    >
      <template>
        <slot />
      </template>
    </v-radio-group>
  </div>
</template>

<script>
export default {
  props: {
    value: { type: undefined, required: false },
    name: { type: String, required: false },
    disabled: { type: Boolean, required: false },
    hideDetails: { type: [Boolean, String], required: false },
  },
};
</script>
