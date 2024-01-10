<template>
  <div class="control-hint" v-if="value">
    {{ value }}
  </div>
</template>

<script>
export default {
  props: ['value'],
};
</script>

<style scoped lang="scss">
.control-hint {
  color: rgba(0, 0, 0, 0.7);
  font-weight: 500;
}
</style>
