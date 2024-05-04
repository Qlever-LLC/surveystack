<template>
  <div class="wrapper">
    <div class="py-2 d-flex justify-center">
      <app-login :initialEmail="initialEmail" :defaultUsePassword="defaultUsePassword" :useLink="true" />
    </div>
  </div>
</template>

<script setup>
import AppLogin from '@/components/ui/Login.vue';

const props = defineProps({
  initialEmail: {
    type: String,
    required: false,
  },
  // true: start with user/pw login, false: start with magic link login
  defaultUsePassword: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped lang="scss">
.wrapper {
  background-color: rgb(var(--v-theme-background));
  height: 100%;
}
</style>
