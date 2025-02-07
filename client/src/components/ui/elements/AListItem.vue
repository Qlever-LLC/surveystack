<template>
  <v-list-item
    :active="active"
    :append-icon="appendIcon"
    :color="color"
    :density="dense ? 'compact' : 'default'"
    :disabled="disabled"
    :elevation="elevation"
    :href="href"
    :lines="twoLine ? 'two' : threeLine ? 'three' : 'one'"
    :link="link"
    :prepend-avatar="prependAvatar"
    :prepend-icon="prependIcon"
    :rounded="rounded"
    :target="target"
    :theme="theme"
    :title="title"
    :to="to"
    :value="value"
    :variant="flat ? 'flat' : 'text'"
    v-bind="$attrs">
    <template v-if="!prependIcon" v-slot:prepend="{ isSelected }">
      <slot name="prepend" :isSelected="isSelected" />
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
    active: { type: Boolean, required: false },
    appendIcon: { type: String, required: false },
    color: { type: String, required: false },
    dense: { type: Boolean, required: false },
    disabled: { type: Boolean, required: false },
    elevation: { type: [String, Number], required: false },
    flat: { type: Boolean, required: false },
    href: { type: [String, Object], required: false },
    link: { type: Boolean, default: undefined },
    prependAvatar: { type: String, required: false },
    prependIcon: { type: String, required: false },
    rounded: { type: [Boolean, String], required: false },
    target: { type: String, required: false },
    theme: { type: String, required: false },
    threeLine: { type: Boolean, required: false },
    title: { type: undefined, required: false },
    to: { type: [String, Object], required: false },
    twoLine: { type: Boolean, required: false },
    value: { type: undefined, required: false },
  },
  //emits: ['click'], do not declare click event, this would prevent $attrs from containing that event so we would have to register @click manually but then, v-list-item would always render the component as clickable, even if the consumer of a-list-item did not want that
};
</script>
