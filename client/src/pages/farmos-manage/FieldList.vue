<template>
  <a-sheet :border="true">
    <a-list subheader>
      <a-list-subheader>Fields added to Farmos Instance</a-list-subheader>
      <a-list-item v-for="(field, idx) in modelValue" :key="`field_${idx}`" prepend-icon="mdi-map">
        {{ field.name }}
        <template v-slot:append>
          <a-list-item-action>
            <a-btn icon>
              <a-icon color="grey-lighten-1" @click="remove(field)">mdi-delete</a-icon>
            </a-btn>
          </a-list-item-action>
        </template>
      </a-list-item>
    </a-list>
  </a-sheet>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Array,
    required: false,
  },
});

const emit = defineEmits(['update:modelValue']);
function remove(e) {
  const arr = props.modelValue.filter((v) => v !== e);
  emit('update:modelValue', arr);
}
</script>
