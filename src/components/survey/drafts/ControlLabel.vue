<template>
  <div
    v-if="value"
    class="control-label"
  >{{value}}</div>
</template>

<script>
export default {
  props: ['value'],
};
</script>

<style scoped>
.control-label {
  font-size: 1.25rem;
  line-height: 2rem;
  font-weight: 500;
  letter-spacing: 0.0125em;
  padding: 0px 0px 12px 0px;
}
</style>
