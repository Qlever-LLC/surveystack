<template>
  <v-text-field
    ref="refAnchor"
    :append-inner-icon="appendInnerIcon"
    :autocomplete="autocomplete"
    :autofocus="autofocus"
    :bgColor="bgColor"
    :class="{ noBorder: disabled }"
    :clear-icon="clearIcon"
    :clearable="clearable"
    :color="color"
    :data-test-id="dataTestId"
    :density="dense ? 'compact' : 'default'"
    :disabled="disabled"
    :error-messages="errorMessages"
    :hide-details="hideDetails"
    :hint="hint"
    :id="id"
    :label="label"
    :loading="loading"
    :modelValue="modelValue"
    :persistent-hint="persistentHint"
    :persistent-placeholder="placeholder ? true : false"
    :placeholder="placeholder"
    :prepend-inner-icon="prependInnerIcon"
    :primary="primary"
    :readonly="readonly"
    :required="required"
    :rounded="rounded"
    :rules="rules"
    :single-line="singleLine"
    :suffix="suffix"
    :tabindex="tabindex"
    :type="type"
    :validate-on-blur="validateOnBlur"
    :variant="variant"
    @blur="$emit('blur')"
    @click:appendInner="$emit('click:appendInner', $event)"
    @click:clear="$emit('click:clear', $event)"
    @focusout="$emit('focusout')"
    @keydown.esc="$emit('keydown.esc')"
    @keyup.enter="$emit('keyup.enter')"
    @update:modelValue="$emit('update:modelValue', $event)">
    <template v-if="appendSlot" v-slot:append>
      <slot name="append" />
    </template>
    <template v-if="labelSlot" v-slot:label>
      <slot name="label" />
    </template>
  </v-text-field>
</template>

<script>
export default {
  name: 'ATextField',
  // click event listened to by slot:activator
  emits: ['blur', 'click:appendInner', 'click:clear', 'focusout', 'keydown.esc', 'keyup.enter', 'update:modelValue'],
  props: {
    appendSlot: { type: Boolean, required: false },
    labelSlot: { type: Boolean, required: false },
    //non vuetify props
    autocomplete: { type: String, required: false },
    dataTestId: { type: String, required: false },
    id: { type: String, required: false },
    primary: { type: Boolean, required: false },
    required: { type: Boolean, required: false },
    tabindex: { type: String, required: false },
    //vuetify props
    appendInnerIcon: { type: String, required: false },
    autofocus: { type: Boolean, required: false },
    bgColor: { type: String, required: false },
    clearIcon: { type: String, required: false },
    clearable: { type: Boolean, required: false },
    color: { type: String, required: false, default: 'focus' },
    dense: { type: Boolean, required: false },
    disabled: { type: Boolean, required: false },
    errorMessages: { type: [Array, String], required: false },
    hideDetails: { type: [Boolean, String], required: false },
    hint: { type: String, required: false },
    label: { type: String, required: false },
    loading: { type: [Boolean, String], required: false },
    persistentHint: { type: Boolean, required: false },
    placeholder: { type: String, required: false },
    prependInnerIcon: { type: String, required: false },
    readonly: { type: Boolean, required: false },
    rounded: { type: [String, Number, Boolean], required: false },
    rules: { type: Array, required: false },
    singleLine: { type: Boolean, required: false },
    suffix: { type: String, required: false },
    type: { type: String, required: false },
    validateOnBlur: { type: Boolean, required: false },
    variant: {
      type: String,
      validator: function (value) {
        return ['outlined', 'underlined', 'filled', 'solo', 'solo-filled'].includes(value);
      },
      default: 'underlined',
      required: false,
    },
    modelValue: { type: undefined, required: false },
  },
  methods: {
    focus() {
      this.$refs.refAnchor.focus();
    },
  },
};
</script>

<style scoped lang="scss">
.noBorder >>> .v-input__slot::before {
  border: none !important;
}
</style>
