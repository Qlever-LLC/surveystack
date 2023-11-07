<template>
  <v-checkbox
    v-model="checked"
    class="align-center align-self-start"
    v-bind="$attrs"
    color="grey darken-1"
    hide-details
  >
    <template slot="append" v-if="helperText || $slots['helper-text']">
      <a-tooltip max-width="400" transition="slide-x-transition" right>
        <template v-slot:activator="{ on, attrs }">
          <v-icon v-bind="attrs" v-on="on" size="20">mdi-help-circle-outline</v-icon>
        </template>
        <slot name="helper-text"></slot>
        <span v-if="helperText">{{ helperText }}</span>
      </a-tooltip>
    </template>
  </v-checkbox>
</template>

<script>
import ATooltip from '@/components/ui/ATooltip.vue';
export default {
  components: {
    ATooltip,
  },
  props: {
    value: {
      type: Boolean,
    },
    helperText: {
      type: String,
    },
  },
  computed: {
    checked: {
      get() {
        return this.value || false;
      },
      set(value) {
        this.$emit('input', value);
      },
    },
  },
};
</script>
