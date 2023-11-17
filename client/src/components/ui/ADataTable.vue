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
    @update:selected="$emit('update:selected', $event)"
    @update:sort-by="$emit('update:sort-by', $event)"
    @update:sort-desc="$emit('update:sort-desc', $event)"
  >
    <template v-if="useTopSlot" v-slot:top="scope">
      <slot name="top" v-bind="scope" />
    </template>
    <template v-if="useItemSlot" v-slot:item="scope">
      <slot name="item" v-bind="scope" />
    </template>
    <template v-if="useHeaderDataTableSelectSlot" v-slot:header.data-table-select="scope">
      <slot name="header.data-table-select" v-bind="scope" />
    </template>
    <template v-for="header in headers" v-slot:[`header.${header.value}`]>
      <!-- TODO  v-if="useHeadersSlot"-->
      <slot :name="`header.${header.value}`" />
    </template>
    <template v-if="useItemLabelSlot" v-slot:item.label="{ item }">
      <!-- TODO item.X dynamic-->
      <slot name="item.label" v-bind="{ item }" />
    </template>
    <template v-if="useItemValueSlot" v-slot:item.value="{ item }">
      <!-- TODO item.X dynamic-->
      <slot name="item.value" v-bind="{ item }" />
    </template>
    <template v-if="useItemTagsSlot" v-slot:item.tags="{ item }">
      <!-- TODO item.X dynamic-->
      <slot name="item.tags" v-bind="{ item }" />
    </template>
    <template v-if="useItemActionsSlot" v-slot:item.actions="{ item }">
      <!-- TODO item.X dynamic-->
      <slot name="item.actions" v-bind="{ item }" />
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
    useHeadersSlot: {
      type: Boolean,
      default: false,
    },
    useItemSlot: {
      type: Boolean,
      default: false,
    },
    useItemLabelSlot: {
      type: Boolean,
      default: false,
    },
    useItemValueSlot: {
      type: Boolean,
      default: false,
    },
    useItemTagsSlot: {
      type: Boolean,
      default: false,
    },
    useItemActionsSlot: {
      type: Boolean,
      default: false,
    },
    useHeaderDataTableSelectSlot: {
      type: Boolean,
      default: false,
    },
    useTopSlot: {
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
  methods: {
    getSlotProps(slotName) {
      // You can customize this method to provide specific props for each slot if needed.
      return {
        slotName,
        // Add any other props you want to pass to the slots
      };
    },
  },
  mounted() {
    // Accessing the named slot content
    this.$nextTick(function () {
      for (const slotName in this.$slots) {
        console.log(`Slot "${slotName}":`, this.$slots[slotName]);
      }
    });
  },
};
</script>

<style scoped></style>
