<template>
  <div>
    <a-dialog :modelValue="modelValue" @update:modelValue="$emit('update:modelValue', $event)" max-width="350">
      <a-card class="pa-4" color="red">
        <a-card-title class="headline">{{ title }}</a-card-title>
        <template v-for="(error, idx) in errors" :key="'error_' + idx">
          <div>
            <a-card-text>
              <span style="font-weight: bold">{{ error.title }}</span> {{ error.body }}
            </a-card-text>
          </div>
        </template>
      </a-card>
    </a-dialog>
  </div>
</template>

<script>
export default {
  props: {
    modelValue: Boolean,
    errors: Array,
    title: String,
  },
};
</script>
