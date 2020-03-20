<template>
  <div>
    <v-input>
      <label for="select-items-file-input" class="cursor-pointer">
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

const columns = ['label', 'value', 'tags'];
function columnIsValid(name) {
  return RegExp(this.columns.join('|')).test(name);
}

export default {
  data() {
    return {
      columns,
    };
  },
  methods: {
    columnIsValid,
    filterItemsKeys(items) {
      return items.map(({ label, value, tags }) => ({ label, value, tags }));
    },
    async handleFileChange({ target: { files: [file] } }) {
      console.log('handle file change');
      console.log(file);
      console.log(this.columns);
      try {
        const data = parse(await file.text(), {
          header: true,
          skipEmptyLines: true,
          // Normalize keys / column headings
          transformHeader(header) {
            return columns.reduce(
              (r, x) => r.replace(RegExp(x, 'i'), x),
              header,
            );
          },

        });

        this.$emit('change', this.filterItemsKeys(data.data));
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
