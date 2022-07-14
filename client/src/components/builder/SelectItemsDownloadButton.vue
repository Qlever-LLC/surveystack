<template>
  <v-btn outlined color="primary" @click="download" style="margin-bottom: 1px">
    <v-icon left>mdi-download</v-icon>
    Export CSV
  </v-btn>
</template>

<script>
import { createResourceCsv } from '@/services/csv.service';

export default {
  props: {
    resourceName: {
      type: String,
      required: true,
    },
    items: {
      type: Array,
      required: true,
    },
  },
  methods: {
    filterItemsKeys(items) {
      return items.map(({ label, value, tags }) => ({ label, value, tags }));
    },
    async download() {
      const csv = createResourceCsv(this.items);

      const element = document.createElement('a');
      element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(csv)}`);
      element.setAttribute('download', `${this.resourceName}.csv`);

      element.style.display = 'none';
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);
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
