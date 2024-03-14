<template>
  <v-timeline-item
    :dot-color="dotColor !== '' ? dotColor : 'white'"
    :hide-dot="hideDot"
    :icon="icon"
    :width="width"
    icon-color="white">
    <slot />
  </v-timeline-item>
</template>

<script>
export default {
  props: {
    // vuetify props
    dotColor: { type: String, required: false },
    hideDot: { type: Boolean, required: false },
    icon: { type: String, required: false },
    width: { type: String, required: false },
  },
};
</script>
