<template>
  <div>
    <v-radio :label="label" :value="value" :color="color" @change="$emit('change', $event)" class="mb-2">
      <template v-slot:label>
        <slot name="label" />
      </template>
    </v-radio>
  </div>
</template>

<script>
export default {
  props: {
    label: { type: String, required: false },
    value: { type: undefined, required: true },
    color: { type: String, required: false },
  },
};
</script>
