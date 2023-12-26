<template>
  <v-list
    :flat="flat"
    :density="dense ? 'compact' : 'default'"
    :two-line="twoLine"
    :subheader="subheader"
    :max-width="maxWidth"
    :selected="selected"
    :select-strategy="selectStrategy"
    @update:selected="$emit('update:selected', $event)"
  >
    <slot />
  </v-list>
</template>

<script setup>
defineProps({
  flat: { type: Boolean, required: false },
  dense: { type: Boolean, required: false },
  twoLine: { type: Boolean, required: false },
  subheader: { type: Boolean, required: false },
  maxWidth: { type: [Number, String], required: false },
  selected: { type: Array, required: false },
  selectStrategy: { type: String, required: false },
});
defineEmits(['update:selected']);
</script>
