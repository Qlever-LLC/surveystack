<template>
  <div class="wrapper">
    <a-container class="maxw-40">
      <app-forgot-password :useLink="true" />
    </a-container>
  </div>
</template>

<script>
import AppForgotPassword from '@/components/ui/ForgotPassword.vue';
import AContainer from '@/components/ui/AContainer.vue';

export default {
  components: {
    AppForgotPassword,
    AContainer,
  },
};
</script>

<style scoped>
.wrapper {
  height: 100%;
  background-color: var(--v-background-base);
}
</style>
