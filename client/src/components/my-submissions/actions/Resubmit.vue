<template>
  <v-btn color="primary" elevation="0" rounded small outlined>
    <v-icon left small>mdi-redo-variant</v-icon>
    Resubmit
  </v-btn>
</template>

<script>
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  props: {
    submission: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    return {};
  },
});
</script>
