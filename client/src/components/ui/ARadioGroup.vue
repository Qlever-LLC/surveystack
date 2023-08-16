<template>
  <div>
    <v-radio-group class="mt-0" :value="value" @change="$emit('input', $event)" :name="name" :disabled="disabled">
      <template>
        <slot />
      </template>
    </v-radio-group>
  </div>
</template>

<script>
export default {
  props: {
    value: { type: undefined, required: false },
    name: { type: String, required: false },
    disabled: { type: Boolean, required: false },
  },
};
</script>
