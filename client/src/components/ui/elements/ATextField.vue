<template>
  <v-text-field
    ref="refAnchor"
    @blur="$emit('blur')"
    @click="$emit('click', $event)"
    @click:append="$emit('click:append', $event)"
    @change="$emit('change', $event)"
    @focusout="$emit('focusout')"
    @input="$emit('input', $event)"
    @keydown.esc="$emit('keydown.esc')"
    @keyup.enter="$emit('keyup.enter')"
    :autocomplete="autocomplete"
    :class="{ noBorder: disabled }"
    :data-test-id="dataTestId"
    :id="id"
    :primary="primary"
    :required="required"
    :tabindex="tabindex"
    :append-icon="appendIcon"
    :autofocus="autofocus"
    :clear-icon="clearIcon"
    :clearable="clearable"
    :color="color"
    :dense="dense"
    :disabled="disabled"
    :error-messages="errorMessages"
    :filled="filled"
    :hide-details="hideDetails"
    :hint="hint"
    :label="label"
    :loading="loading"
    :outlined="outlined"
    :persistent-hint="persistentHint"
    :placeholder="placeholder"
    :prepend-icon="prependIcon"
    :readonly="readonly"
    :rules="rules"
    :single-line="singleLine"
    :solo="solo"
    :suffix="suffix"
    :type="type"
    :validate-on-blur="validateOnBlur"
    :value="value"
  >
    <template v-slot:append-outer>
      <slot name="append-outer" />
    </template>
    <template v-slot:label>
      <slot name="label" />
    </template>
  </v-text-field>
</template>

<script>
export default {
  name: 'ATextField',
  // click event listened to by slot:activator
  emits: ['blur', 'click', 'click:append', 'change', 'focusout', 'input', 'keydown.esc', 'keyup.enter'],
  props: {
    //non vuetify props
    autocomplete: { type: String, required: false },
    dataTestId: { type: String, required: false },
    id: { type: String, required: false },
    primary: { type: Boolean, required: false },
    required: { type: Boolean, required: false },
    tabindex: { type: String, required: false },
    //vuetify props
    appendIcon: { type: String, required: false },
    autofocus: { type: Boolean, required: false },
    clearIcon: { type: String, required: false },
    clearable: { type: Boolean, required: false },
    color: { type: String, required: false },
    dense: { type: Boolean, required: false },
    disabled: { type: Boolean, required: false },
    errorMessages: { type: [Array, String], required: false },
    filled: { type: Boolean, required: false },
    hideDetails: { type: [Boolean, String], required: false },
    hint: { type: String, required: false },
    label: { type: String, required: false },
    loading: { type: [Boolean, String], required: false },
    outlined: { type: Boolean, required: false },
    persistentHint: { type: Boolean, required: false },
    placeholder: { type: String, required: false },
    prependIcon: { type: String, required: false },
    readonly: { type: Boolean, required: false },
    rules: { type: Array, required: false },
    singleLine: { type: Boolean, required: false },
    solo: { type: Boolean, required: false },
    suffix: { type: String, required: false },
    type: { type: String, required: false },
    validateOnBlur: { type: Boolean, required: false },
    value: { type: undefined, required: false },
  },
  methods: {
    blur() {
      this.$refs.refAnchor.blur();
    },
    focus() {
      this.$refs.refAnchor.focus();
    },
  },
};
</script>

<style scoped>
.noBorder >>> .v-input__slot::before {
  border: none !important;
}
</style>
