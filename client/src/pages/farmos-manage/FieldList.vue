<template>
  <a-sheet :border="true">
    <a-list subheader>
      <a-list-subheader>Fields added to Farmos Instance</a-list-subheader>

      <a-list-item v-for="(field, idx) in modelValue" :key="`field_${idx}`" prepend-avatar="mdi-map">
        <a-list-item-title v-text="field.name"></a-list-item-title>
        <a-list-item-action>
          <a-btn icon>
            <a-icon color="grey-lighten-1" @click="remove(field)">mdi-delete</a-icon>
          </a-btn>
        </a-list-item-action>
      </a-list-item>
    </a-list>
  </a-sheet>
</template>

<script>
export default {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  methods: {
    remove(e) {
      const arr = this.modelValue.filter((v) => v !== e);
      this.$emit('update:modelValue', arr);
    },
  },
};
</script>
