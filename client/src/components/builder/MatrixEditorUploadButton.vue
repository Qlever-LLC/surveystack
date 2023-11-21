<template>
  <div>
    <a-input>
      <label for="select-items-file-input" class="cursor-pointer">
        <v-btn class="pointer-events-none" color="primary">
          <v-icon left>mdi-upload</v-icon>
          Import CSV
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
    </a-input>
  </div>
</template>

<script>
import { parse } from 'papaparse';
import ObjectId from 'bson-objectid';

export default {
  methods: {
    async handleFileChange({
      target: {
        files: [file],
      },
    }) {
      try {
        const parsed = parse(await file.text(), {
          header: true,
          skipEmptyLines: true,
          // Normalize column headings and remove TYPE from "h|TYPE"
          transformHeader(h) {
            return h.trim().toLowerCase().split('|')[0];
          },
        });

        const parsedHeaders = parse(await file.text(), {
          header: true,
          skipEmptyLines: true,
          preview: 1,
        });

        const items = parsed.data.map((item) => ({
          ...item,
          _row: new ObjectId().toString(),
          _prefill: item._prefill === '1' || item._prefill === 'y' || item.prefill === 'Y',
        }));

        const fields = parsed.meta.fields.filter((f) => !f.startsWith('_'));
        const headers = parsedHeaders.meta.fields
          .filter((f) => !f.startsWith('_'))
          .map((field) => ({
            text: field.split('|')[0],
            value: field.split('|')[0],
            type: field.split('|')[1] || 'text',
          }));
        const data = [...items];

        this.$emit('change', { fields, headers, data });
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
