<template>
  <div>
    <v-radio-group class="mt-0" :value="modelValue" @change="$emit('change', $event)">
      <template>
        <slot />
      </template>
    </v-radio-group>
  </div>
</template>

<script>
export default {
  props: {
    value: { default: undefined },
  },
  data() {
    return {
      modelValue: this.value,
    };
  },
};
</script>
