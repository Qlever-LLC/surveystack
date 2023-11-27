<template>
  <a-dialog v-model="open" max-width="50%" hide-overlay>
    <a-card min-height="50vh" class="d-flex flex-column">
      <a-card-title class="justify-space-between align-center">
        <p>Survey Reference Preview</p>
        <select-items-download-button :resourceName="resource.name" :items="items" />
      </a-card-title>

      <a-card-text class="mt-4">
        <v-data-table
          :headers="tableHeaders"
          :items="items"
          :loading="loading"
          item-key="id"
          :footer-props="{ 'items-per-page-options': [10, 20, 50, 100, -1] }"
        />
      </a-card-text>

      <a-spacer />

      <a-card-actions class="mr-3 d-flex justify-end">
        <a-btn text @click="open = false">Close</a-btn>
      </a-card-actions>
    </a-card>
  </a-dialog>
</template>

<script>
import { computed, defineComponent, ref, watchEffect } from 'vue';
import SelectItemsDownloadButton from '@/components/builder/SelectItemsDownloadButton';

import { get, groupBy } from 'lodash';
import api from '@/services/api.service';

export default defineComponent({
  components: {
    SelectItemsDownloadButton,
  },
  props: {
    value: {
      type: Boolean,
    },
    resource: {
      type: Object,
      required: true,
    },
  },
  emits: ['input'],
  setup(props, { emit }) {
    const items = ref([]);
    const loading = ref(false);
    const params = ref(null);
    const open = computed({
      get: () => props.value || false,
      set: (value) => emit('input', value),
    });

    const fetchSubmissions = async (surveyId, path) => {
      loading.value = true;

      const query = `&project={"${path}.value":1}`;
      const { data } = await api.get(`/submissions?survey=${surveyId}${query}`);
      const submissions = data
        .map((item) => {
          const value = get(item, `${path}.value`, null);
          return {
            id: item._id,
            label: JSON.stringify(value).replace(/^"(.+(?="$))"$/, '$1'),
            value,
          };
        })
        .filter((item) => item.value !== null);

      const explodeItem = (item) =>
        item.value
          .map((v, i) => ({
            id: `${item.id}__${i}`,
            // stringify and remove wrapping quote characters so that strings are rendered without quotation marks
            label: JSON.stringify(v).replace(/^"(.+(?="$))"$/, '$1'),
            value: v,
          }))
          .filter((v) => v.value);

      const explodedItems = submissions.flatMap((it) => (Array.isArray(it.value) ? explodeItem(it) : [it]));
      const uniqueItems = Object.values(groupBy(explodedItems, 'label')).map((group) => group[0]);

      items.value = uniqueItems;
      loading.value = false;
    };

    watchEffect(() => {
      const { id, path } = props.resource.content;
      const key = id + path;

      // Skip fetching if dialog is closed or already fetchced items
      if (!props.value || params.value === key) {
        return;
      }

      params.value = key;
      items.value = [];
      fetchSubmissions(id, path);
    });

    return {
      tableHeaders: [
        {
          text: 'Label',
          value: 'label',
        },
        {
          text: 'Value',
          value: 'value',
        },
      ],
      open,
      items,
      loading,
    };
  },
});
</script>
