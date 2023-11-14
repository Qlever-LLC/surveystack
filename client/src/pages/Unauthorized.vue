<template>
  <a-container>
    <h1>Access denied</h1>
    Only {{ allowed }} are allowed on <strong>{{ to.path }}</strong
    >. Goodbye!
  </a-container>
</template>

<script>
import AContainer from '@/components/ui/AContainer.vue';

export default {
  components: {
    AContainer,
  },
  props: {
    allowed: {
      type: String,
      default: 'Super Admins',
    },
    to: {
      type: Object,
      default() {
        return { path: '??' };
      },
    },
  },
};
</script>
