<template>
  <a-chip class="px-4 mx-1" small :color="color">
    <span class="font-weight-bold white--text">
      <a-icon x-small left>{{ icon }}</a-icon>
      <slot>???</slot>
    </span>
  </a-chip>
</template>

<script>
import AIcon from '@/components/ui/AIcon.vue';

export default {
  components: { AIcon },
  props: {
    icon: {
      type: String,
      default: 'mdi-help-circle-outline',
    },
    color: {
      type: String,
      default: '#bbb',
    },
  },
};
</script>
