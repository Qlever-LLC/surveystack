<template>
  <v-img :contain="contain" :gradient="gradient" :height="height" :src="src">
    <slot />
  </v-img>
</template>

<script>
export default {
  props: {
    contain: {
      type: Boolean,
      default: false,
    },
    gradient: {
      type: String,
      required: false,
    },
    height: {
      type: [Number, String],
      required: false,
    },
    src: {
      type: [String, Object],
      required: false,
    },
  },
  emits: [],
  setup() {
    return {};
  },
};
</script>
