<template>
  <div class="wrapper">
    <register :initialEmail="initialEmail" :useLink="true" class="maxw-40" />
  </div>
</template>

<script setup>
import Register from '@/components/ui/Register.vue';

const props = defineProps({
  initialEmail: {
    type: String,
    required: false,
  },
});
</script>

<style scoped lang="scss">
.wrapper {
  background-color: rgb(var(--v-theme-background));
  height: 100%;
}
</style>
