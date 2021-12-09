<template>
  <span v-if="index === 0" class="mr-1">{{ label }}</span>
  <span v-else-if="index === 1" class="grey--text text-caption others">
    (+{{ value.length - 1 }} {{ value.length > 2 ? 'others' : 'other' }})
  </span>
</template>

<script>
export default {
  props: {
    label: String,
    index: Number,
    value: Array,
  },
};
</script>
