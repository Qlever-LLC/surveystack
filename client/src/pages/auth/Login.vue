<template>
  <div class="wrapper">
    <div class="py-2 d-flex justify-center">
      <app-login :useLink="true" />
    </div>
  </div>
</template>

<script>
import AppLogin from '@/components/ui/Login.vue';

export default {
  components: {
    AppLogin,
  },
};
</script>

<style scoped>
.wrapper {
  background-color: var(--v-background-base);
  height: 100%;
}
</style>
