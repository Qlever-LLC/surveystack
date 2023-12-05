<template>
  <v-list-item
    :append-icon="appendIcon"
    :prepend-avatar="prependAvatar"
    :prepend-icon="prependIcon"
    :variant="flat ? 'flat' : 'text'"
    :density="dense ? 'compact' : 'default'"
    :link="link"
    :lines="twoLine ? 'two' : threeLine ? 'three' : 'one'"
    :href="href"
    :to="to"
    :target="target"
    :value="value"
    v-bind="$attrs"
    @click="$emit('click', $event)"
  >
    <slot name="prepend" />
    <slot />
  </v-list-item>
</template>

<script>
export default {
  props: {
    flat: { type: Boolean, required: false },
    dense: { type: Boolean, required: false },
    link: { type: Boolean, default: undefined },
    twoLine: { type: Boolean, required: false },
    threeLine: { type: Boolean, required: false },
    href: { type: [String, Object], required: false },
    to: { type: String, required: false },
    target: { type: String, required: false },
    value: { type: undefined, required: false },
    color: { type: String, required: false },
    appendIcon: { type: String, required: false },
    prependIcon: { type: String, required: false },
    prependAvatar: { type: String, required: false },
  },
  emits: ['click'],
};
</script>
