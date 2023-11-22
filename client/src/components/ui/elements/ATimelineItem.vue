<template>
  <v-timeline-item :color="color" :hide-dot="hideDot" :icon="icon"> <slot /> </v-timeline-item>
</template>

<script>
export default {
  props: {
    // //vuetify props
    color: { type: String, required: false },
    hideDot: { type: Boolean, required: false },
    icon: { type: String, required: false },
  },
};
</script>
