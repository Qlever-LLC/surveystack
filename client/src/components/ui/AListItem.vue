<template>
  <div>
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
    >
      <slot />
    </v-list-item>
  </div>
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
};
</script>
