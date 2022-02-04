<template>
  <div class="wrapper">
    <register :useLink="true" class="maxw-40" />
  </div>
</template>

<script>

import Register from '@/components/ui/Register.vue';

export default {
  components: {
    Register,
  },
};
</script>

<style scoped>
.wrapper {
  background-color: var(--v-background-base);
  height: 100%;
}
</style>
