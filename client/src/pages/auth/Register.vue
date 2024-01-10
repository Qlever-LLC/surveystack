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

<style scoped lang="scss">
.wrapper {
  background-color: rgb(var(--v-theme-background));
  height: 100%;
}
</style>
