<template>
  <div class="control-more-info" v-if="value">
    {{ value }}
  </div>
</template>

<script>
export default {
  props: ['value'],
};
</script>

<style scoped>
.control-more-info {
  color: rgba(0, 0, 0, 0.6);
  margin-top: 12px;
}
</style>
