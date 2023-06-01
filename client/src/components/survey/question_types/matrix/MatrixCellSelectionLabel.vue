<template>
  <span v-if="index === 0 && html" v-html="html"></span>
  <span v-else-if="index === 0 && !html">{{ label }}</span>
  <span v-else-if="index === 1 && Array.isArray(value)" class="grey--text text-caption others">
    (+{{ value.length - 1 }} {{ value.length > 2 ? 'others' : 'other' }})
  </span>
</template>

<script>
export default {
  props: {
    index: Number,
    label: String,
    html: String,
    value: [Array, String, Object],
  },
};
</script>
