<template>
  <v-img :cover="cover" :gradient="gradient" :height="height" :src="src">
    <slot />
  </v-img>
</template>

<script>
export default {
  name: 'AImg',
  props: {
    cover: {
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
