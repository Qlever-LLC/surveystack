<template>
  <v-badge :bordered="bordered" :color="color" :content="content" :left="left">
    <slot />
  </v-badge>
</template>

<script>
export default {
  props: {
    //vuetify props
    color: { type: String, required: false },
    content: { type: undefined, required: false },
    bordered: { type: Boolean, required: false },
    left: { type: Boolean, required: false },
  },
};
</script>
