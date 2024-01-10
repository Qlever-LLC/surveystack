<template>
  <!-- v-if="state.isEditing" -->
  <a-text-field
    :modelValue="value"
    @update:modelValue="$emit('input', $event)"
    @blur="setIsEditing(false)"
    placeholder="Untitled Survey"
    class="full-width"
    :rules="[rules.hasOnlyValidCharacters, rules.hasValidLength]"
    :autofocus="value === ''" />
  <!-- <div
    v-else
    @click="() => setIsEditing(true)"
    @focus="() => setIsEditing(true)"
    class="text-h1 mb-4 mt-3 d-flex"
    :style="{ borderBottom: '2px solid transparent', letterSpacing: 'normal !important', }"
  >
    <div v-if="value">{{ value }}</div>
    <div v-else class="grey--text lighten-4">Untitled Survey</div>
  </div> -->
</template>

<script>
import { reactive } from 'vue';

export default {
  props: {
    value: String,
  },
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
      isEditing: !props.value || false,
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
  font-size: 2.125rem;
  padding-top: 0;
  padding-bottom: 0;
  line-height: 10px;
  min-height: 0;
}
.v-text-field {
  min-height: 0;
}
</style>
