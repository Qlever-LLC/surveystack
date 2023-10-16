<template>
  <a-btn outlined color="primary" @click="download" style="margin-bottom: 1px">
    <v-icon left>mdi-download</v-icon>
    Export CSV
  </a-btn>
</template>

<script>
import { createResourceCsv } from '@/services/csv.service';
import downloadExternal from '@/utils/downloadExternal';
import ABtn from '@/components/ui/ABtn.vue';

export default {
  components: { ABtn },
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
      downloadExternal(`data:text/plain;charset=utf-8,${encodeURIComponent(csv)}`, `${this.resourceName}.csv`);
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
