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
  background-color: rgb(var(--v-theme-background));
  height: 100%;
}
</style>
