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
    :title="title"
    :value="value"
    v-bind="$attrs">
    <template v-if="!prependIcon" v-slot:prepend>
      <slot name="prepend" />
    </template>
    <template v-if="!appendIcon" v-slot:append>
      <slot name="append" />
    </template>
    <template v-slot:default>
      <slot name="default" />
    </template>
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
    title: { type: undefined, required: false },
    value: { type: undefined, required: false },
    color: { type: String, required: false },
    appendIcon: { type: String, required: false },
    prependIcon: { type: String, required: false },
    prependAvatar: { type: String, required: false },
  },
  //emits: ['click'], do not declare click event, this would prevent $attrs from containing that event so we would have to register @click manually but then, v-list-item would always render the component as clickable, even if the consumer of a-list-item did not want that
};
</script>
