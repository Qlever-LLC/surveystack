<template>
  <div>
    <v-input>
      <label
        for="select-items-file-input"
        class="cursor-pointer"
      >
        <v-btn class="pointer-events-none">
          <v-icon>mdi-upload</v-icon>
          Add CSV
        </v-btn>
      </label>
      <input
        type="file"
        id="select-items-file-input"
        ref="select-items-file-input"
        accept=".csv"
        class="d-none"
        @change="handleFileChange"
      />
    </v-input>
  </div>
</template>

<script>
import { parse } from 'papaparse';
import ObjectId from 'bson-objectid';

export default {
  methods: {
    async handleFileChange({ target: { files: [file] } }) {
      console.log('handle file change');
      console.log(file);
      try {
        const parsed = parse(await file.text(), {
          header: true,
          skipEmptyLines: true,
          // Normalize column headings
          transformHeader(h) {
            return h.trim().toLowerCase();
          },
        });

        console.log(parsed);

        const items = parsed.data
          .map(item => ({
            ...item,
            id: new ObjectId().toString(),
          }));
        this.$emit('change', [parsed.meta.fields, ...items]);
        this.$refs['select-items-file-input'].value = null;
      } catch (err) {
        console.error('error parsing CSV file', err);
      }
    },
  },
};
</script>

<style scoped>
.pointer-events-none {
  pointer-events: none !important;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
