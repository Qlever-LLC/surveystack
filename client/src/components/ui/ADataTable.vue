<template>
  <v-data-table
    :disable-pagination="disablePagination"
    :disable-sort="disableSort"
    :footer-props="footerProps"
    :headers="headers"
    :hide-default-footer="hideDefaultFooter"
    :hide-default-header="hideDefaultHeader"
    :item-key="itemKey"
    :items="items"
    :loading="loading"
    :mobile-breakpoint="mobileBreakpoint"
    :multi-sort="multiSort"
    :search="search"
    :server-items-length="serverItemsLength"
    :show-select="showSelect"
    :sort-by="sortBy"
    :sort-desc="sortDesc"
    :value="value"
    @input="$emit('input', $event)"
    @update:sort-by="$emit('update:sort-by', $event)"
    @update:sort-desc="$emit('update:sort-desc', $event)"
  >
    <template v-for="(_, slot) of $slots" v-slot:[slot]="scope">
      <slot :name="slot" v-bind="scope" />
    </template>
  </v-data-table>
</template>

<script>
export default {
  props: {
    disablePagination: {
      type: Boolean,
      default: false,
    },
    disableSort: {
      type: Boolean,
      default: false,
    },
    footerProps: {
      type: Object,
      required: false,
    },
    headers: {
      type: Array,
      default: () => [],
    },
    hideDefaultFooter: {
      type: Boolean,
      default: false,
    },
    hideDefaultHeader: {
      type: Boolean,
      default: false,
    },
    itemKey: {
      type: String,
      default: 'id',
    },
    items: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: [Boolean, String],
      default: false,
    },
    mobileBreakpoint: {
      type: [Number, String],
      default: 600,
    },
    multiSort: {
      type: Boolean,
      default: false,
    },
    search: {
      type: String,
      required: false,
    },
    serverItemsLength: {
      type: Number,
      default: -1,
    },
    showSelect: {
      type: Boolean,
      default: false,
    },
    sortBy: {
      type: [String, Array],
      required: false,
    },
    sortDesc: {
      type: [Boolean, Array],
      required: false,
    },
    value: {
      type: Array,
      default: () => [],
    },
  },
  emit: ['input', 'update:sort-by', 'update:sort-desc'],
};
</script>

<style scoped></style>
