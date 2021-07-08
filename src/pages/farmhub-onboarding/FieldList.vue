<template>
  <v-sheet outlined>
    <v-list subheader>
      <v-subheader>Fields added to Farmos Instance</v-subheader>

      <v-list-item v-for="(field, idx) in value" :key="`field_${idx}`">
        <v-list-item-avatar>
          <v-icon class="primary lighten-1" dark> mdi-map </v-icon>
        </v-list-item-avatar>

        <v-list-item-content>
          <v-list-item-title v-text="field.name"></v-list-item-title>
        </v-list-item-content>

        <v-list-item-action>
          <v-btn icon>
            <v-icon color="grey lighten-1" @click="remove(field)">mdi-delete</v-icon>
          </v-btn>
        </v-list-item-action>
      </v-list-item>
    </v-list>
  </v-sheet>
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
