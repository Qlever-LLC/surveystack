<template>
  <div>
    <v-text-field
      :autocomplete="autocomplete"
      :data-test-id="dataTestId"
      :id="id"
      @blur="$emit('blur', $event)"
      @input="$emit('input', $event)"
      @change="$emit('change', $event)"
      :append-icon="appendIcon"
      :autofocus="autofocus"
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
      :type="type"
      :validate-on-blur="validateOnBlur"
      :value="value"
    />
  </div>
</template>

<script>
export default {
  props: {
    //non vuetify props
    autocomplete: { type: String, required: false },
    dataTestId: { type: String, required: false },
    id: { type: String, required: false },
    //vuetify props
    appendIcon: { type: String, required: false },
    autofocus: { type: Boolean, required: false },
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
    type: { type: String, required: false },
    validateOnBlur: { type: Boolean, required: false },
    value: { type: undefined, required: false },
  },
};
</script>
