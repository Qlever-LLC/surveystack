<template>
  <v-list-item
    :flat="flat"
    :dense="dense"
    :link="link"
    :two-line="twoLine"
    :three-line="threeLine"
    :href="href"
    :to="to"
    :target="target"
    :value="value"
    v-on="hasClickListener ? { click: (v) => $emit('click', v) } : {}"
  >
    <slot />
  </v-list-item>
</template>

<script>
export default {
  props: {
    flat: { type: Boolean, required: false },
    dense: { type: Boolean, required: false },
    link: { type: Boolean, required: false },
    twoLine: { type: Boolean, required: false },
    threeLine: { type: Boolean, required: false },
    href: { type: [String, Object], required: false },
    to: { type: [String, Object], required: false },
    target: { type: String, required: false },
    value: { type: undefined, required: false },
    color: { type: String, required: false },
  },
  emits: ['click'],
  computed: {
    hasClickListener() {
      // we should only register the @click handler on v-list-item if we need to
      // otherwise v-list-item would show hover effects even if our consumer does not want it to be clickable
      return this.$listeners && this.$listeners.click;
    },
  },
};
</script>
