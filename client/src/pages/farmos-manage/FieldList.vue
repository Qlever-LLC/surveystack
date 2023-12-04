<template>
  <a-sheet outlined>
    <a-list subheader>
      <a-list-subheader>Fields added to Farmos Instance</a-list-subheader>

      <a-list-item v-for="(field, idx) in value" :key="`field_${idx}`" prepend-avatar="mdi-map">
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
  props: ['value'],

  methods: {
    remove(e) {
      const arr = this.value.filter((v) => v !== e);
      this.$emit('input', arr);
    },
  },
};
</script>
