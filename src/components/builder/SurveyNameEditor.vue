<template>
    <!-- v-if="state.isEditing" -->
  <v-text-field
    :value="value"
    @input="emitInput"
    @blur="setIsEditing(false)"
    placeholder="Untitled Survey"
    class="display-1"
    :rules="[rules.hasOnlyValidCharacters, rules.hasValidLength]"
    autofocus
  />
  <!-- <div
    v-else
    @click="() => setIsEditing(true)"
    @focus="() => setIsEditing(true)"
    class="display-1 mb-4 mt-3 d-flex"
    :style="{ borderBottom: '2px solid transparent', letterSpacing: 'normal !important', }"
  >
    <div v-if="value">{{ value }}</div>
    <div v-else class="grey--text lighten-4">Untitled Survey</div>
  </div> -->
</template>

<script>
import { reactive } from '@vue/composition-api';

export default {
  props: {
    value: String,
  },
  setup(props, context) {
    const state = reactive({
      isEditing: !props.value || false,
    });

    function setIsEditing(val) {
      state.isEditing = val;
    }

    return {
      state,
      emitInput: val => context.emit('input', val),
      setIsEditing,
      rules: {
        hasOnlyValidCharacters(val) {
          return /^[\w-]*$/.test(val) ? true : 'survey name cannot contain special characters';
        },
        hasValidLength(val) {
          return val.length > 4 ? true : 'survey name must be at least 5 characters long';
        },
      },
    };
  },
};
</script>
