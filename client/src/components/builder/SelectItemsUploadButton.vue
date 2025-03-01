<template>
  <a-input>
    <label for="select-items-file-input" class="cursor-pointer">
      <a-btn class="pointer-events-none" color="primary" :disabled="disabled">
        <a-icon left>mdi-upload</a-icon>
        Add CSV
      </a-btn>
    </label>
    <input
      type="file"
      id="select-items-file-input"
      ref="select-items-file-input"
      accept=".csv"
      class="d-none"
      @change="handleFileChange" />
  </a-input>
</template>

<script>
import { parse } from 'papaparse';
import ObjectId from 'bson-objectid';

const columns = ['label', 'value', 'tags'];
function columnIsValid(name) {
  return RegExp(this.columns.join('|')).test(name);
}

export default {
  props: {
    disabled: {
      type: Boolean,
      required: false,
      default: () => false,
    },
  },
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
    async handleFileChange({
      target: {
        files: [file],
      },
    }) {
      try {
        const data = parse(await file.text(), {
          header: true,
          skipEmptyLines: true,
          // Normalize keys / column headings
          transformHeader(header) {
            return columns.reduce((r, x) => r.replace(RegExp(x, 'i'), x), header);
          },
        });

        const items = this.filterItemsKeys(data.data).map((item) => ({
          ...item,
          id: new ObjectId().toString(),
        }));
        this.$emit('change', items);
        this.$refs['select-items-file-input'].value = null;
      } catch (err) {
        console.error('error parsing CSV file', err);
      }
    },
  },
};
</script>

<style scoped lang="scss">
.pointer-events-none {
  pointer-events: none !important;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
