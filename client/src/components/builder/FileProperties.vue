<template>
  <div>
    <div class="text--primary">
      Map Options
    </div>

    <v-checkbox
      class="my-1"
      outlined
      v-model="value.allowMultiple"
      label="Allow multiple files"
      color="grey darken-1"
      hide-details
    />
    <v-combobox v-model="value.types" :items="types" chips clearable label="Restrict file types" multiple solo>
      <template v-slot:selection="{ attrs, item, select, selected }">
        <v-chip v-bind="attrs" :input-value="selected" close @click="select" @click:close="removeType(item)">
          <strong>{{ item }}</strong>
        </v-chip>
      </template>
    </v-combobox>
  </div>
</template>

<script>
export default {
  name: 'file-properties',
  data() {
    return {
      types: ['image/*', 'application/pdf', 'text/csv'],
    };
  },
  props: {
    value: {
      type: Object,
      required: true,
    },
  },
  methods: {
    removeType(type) {
      this.value.types.splice(this.value.types.indexOf(type), 1);
      this.value.types = [...this.value.types];
    },
  },
};
</script>

<style></style>
