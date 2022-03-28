<template>
  <div>
    <v-card-title class="px-0 d-flex justify-space-between">
      <span> File upload options </span>
    </v-card-title>

    <div v-if="!value.typesImmutable">
      <div class="text--primary">Restrict uploaded file types (.csv, .pdf, etc.)</div>
      <v-select
        multiple
        chips
        clearable
        deletable-chips
        solo
        v-model="value.types"
        label="allow all files types"
        :items="types"
      />
    </div>

    <v-checkbox
      class="my-1"
      outlined
      v-model="value.allowMultiple"
      label="Allow user to upload multiple files"
      color="grey darken-1"
      hide-details
    />
  </div>
</template>

<script>
export default {
  name: 'file-properties',
  data() {
    return {
      types: [
        { text: 'PDF (.pdf)', value: 'application/pdf' },
        { text: 'Spreadsheets (.csv)', value: 'text/csv' },
        { text: 'Image (.gif, .png, .jpg, .jpeg)', value: 'image/*' },
        { text: 'Plain text (.txt)', value: 'text/plain' },
      ],
    };
  },
  props: {
    value: {
      type: Object,
      required: true,
    },
  },
  methods: {},
};
</script>

<style scoped>
>>> .v-chip .v-chip__close.v-icon.v-icon--right {
  margin-right: 0;
}
</style>
