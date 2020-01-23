<template>
  <div>
    <span v-for="(v, i) in value.slice(0, -1)" :key="i">{{v}} ‣&nbsp;</span>
  </div>
</template>

<script>
export default {
  props: {
    value: Array,
  },
};
</script>
