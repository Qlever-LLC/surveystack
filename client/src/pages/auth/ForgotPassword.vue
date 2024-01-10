<template>
  <div class="wrapper">
    <a-container class="maxw-40">
      <app-forgot-password :useLink="true" />
    </a-container>
  </div>
</template>

<script>
import AppForgotPassword from '@/components/ui/ForgotPassword.vue';

export default {
  components: {
    AppForgotPassword,
  },
};
</script>

<style scoped lang="scss">
.wrapper {
  height: 100%;
  background-color: rgb(var(--v-theme-background));
}
</style>
