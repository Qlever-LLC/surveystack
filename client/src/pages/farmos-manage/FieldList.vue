<template>
  <a-sheet outlined>
    <a-list subheader>
      <a-list-subheader>Fields added to Farmos Instance</a-list-subheader>

      <a-list-item v-for="(field, idx) in value" :key="`field_${idx}`">
        <v-list-item-avatar>
          <a-icon class="primary lighten-1" dark> mdi-map </a-icon>
        </v-list-item-avatar>

        <v-list-item-content>
          <a-list-item-title v-text="field.name"></a-list-item-title>
        </v-list-item-content>

        <a-list-item-action>
          <v-btn icon>
            <a-icon color="grey lighten-1" @click="remove(field)">mdi-delete</a-icon>
          </v-btn>
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
