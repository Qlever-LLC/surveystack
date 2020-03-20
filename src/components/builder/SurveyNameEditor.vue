<template>
  <v-text-field
    v-if="state.isEditing"
    :value="value"
    @input="emitInput"
    @blur="setIsEditing(false)"
    placeholder="Untitled Survey"
    class="display-1"
    autofocus
  />
  <div
    v-else
    @click="() => setIsEditing(true)"
    @focus="() => setIsEditing(true)"
    class="display-1 mb-4 mt-3 d-flex"
    :style="{ borderBottom: '2px solid transparent', letterSpacing: 'normal !important', }"
  >
    <div v-if="value">{{ value }}</div>
    <div v-else class="grey--text lighten-4">Untitled Survey</div>
    <!-- <v-icon class="ml-2">mdi-pencil</v-icon> -->
  </div>
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
    };
  },
};
</script>
