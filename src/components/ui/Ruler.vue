<template>
  <div class="d-flex justify-space-between align-center">
    <div class="flex-grow-1">
      <hr class="left" />
    </div>

    <div class="mx-3" v-if="$slots.default">
      <slot />
    </div>

    <div class="flex-grow-1">
      <hr class="right" />
    </div>
  </div>
</template>

<script>
export default {
  props: ['value'],
};
</script>

<style scoped></style>
