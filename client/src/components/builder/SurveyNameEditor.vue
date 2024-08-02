<template>
  <!-- v-if="state.isEditing" -->
  <a-text-field
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    @blur="setIsEditing(false)"
    placeholder="Untitled Survey"
    class="full-width"
    :rules="[rules.hasOnlyValidCharacters, rules.hasValidLength]"
    :autofocus="modelValue === ''" />
</template>

<script>
import { reactive } from 'vue';

export default {
  props: {
    modelValue: String,
  },
  emits: ['update:modelValue'],
  data: () => ({
    rules: {
      hasOnlyValidCharacters(val) {
        return /^[\w-\s]*$/.test(val) ? true : 'Survey name cannot contain special characters';
      },
      hasValidLength(val) {
        return val.length > 4 ? true : 'Survey name must be at least 5 characters long';
      },
    },
  }),
  setup(props) {
    const state = reactive({
      isEditing: !props.modelValue || false,
    });

    function setIsEditing(val) {
      state.isEditing = val;
    }

    return {
      state,
      setIsEditing,
    };
  },
};
</script>
<style scoped lang="scss">
.v-text-field :deep(input) {
  font-size: 1.5em;
  padding-top: 4px;
  padding-bottom: 0;
  min-height: 0;
}
.v-text-field {
  min-height: 0;
}
</style>
