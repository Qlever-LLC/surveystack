<template>
  <v-dialog v-model="show">
    <v-card>
      <v-card-title class="headline">
        <slot name="title">Header slot content</slot>
      </v-card-title>
      <v-card-text>
        <slot name="default">Default slot content</slot>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="green darken-1" text @click="$emit('cancel')">Cancel</v-btn>
        <v-btn
          color="green darken-1"
          text
          @click="$emit('confirm')"
        >{{labelConfirm ? labelConfirm : 'OK'}}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    value: Boolean,
    labelConfirm: String,
  },
  computed: {
    show: {
      get() {
        return this.value;
      },
      set(value) {
        this.$emit('input', value);
      },
    },
  },
};
</script>
