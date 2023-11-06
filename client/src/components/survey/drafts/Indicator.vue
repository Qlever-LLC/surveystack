<template>
  <a-chip class="px-4 mx-1" small :color="color">
    <span class="font-weight-bold white--text">
      <v-icon x-small left>{{ icon }}</v-icon>
      <slot>???</slot>
    </span>
  </a-chip>
</template>

<script>
import AChip from '@/components/ui/AChip.vue';
export default {
  components: {
    AChip,
  },
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
