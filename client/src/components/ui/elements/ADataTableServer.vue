<template>
  <v-data-table-server
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    :header-props="headerProps"
    :headers="headers"
    :items="items"
    :item-key="itemKey"
    :items-length="itemsLength"
    :loading="loading"
    :multi-sort="multiSort"
    :search="search"
    :show-select="showSelect"
    :sort-by="sortBy"
    @update:sortBy="$emit('update:sortBy', $event)">
    <template v-slot:top><slot name="top" /></template>
    <template v-if="headerSlot" v-slot:header></template>
    <template v-if="headerSlot" v-slot:[`header.data-table-select`]>
      <slot name="header.data-table-select" />
    </template>
    <template v-for="header in headers" :key="header.value" v-slot:[`header.${header.value}`]>
      <slot :name="`header.${header.value}`" />
    </template>
    <template v-slot:item="{ item, index }">
      <slot name="item" :item="item" :index="index" />
    </template>
    <template v-slot:bottom></template>
  </v-data-table-server>
</template>

<script>
export default {
  emits: ['update:modelValue', 'update:sortBy'],
  props: {
    // Named slot set to true to render slot
    headerSlot: { type: Boolean, required: false },
    //vuetify props
    modelValue: { type: undefined, required: false },
    headerProps: { type: undefined, required: false },
    headers: { type: undefined, required: false },
    items: { type: undefined, required: false },
    itemKey: { type: String, required: false },
    itemsLength: { type: [String, Number], required: false },
    loading: { type: [String, Boolean], required: false },
    multiSort: { type: Boolean, required: false },
    search: { type: String, required: false },
    showSelect: { type: Boolean, required: false },
    sortBy: { type: Array, required: false },
  },
};
</script>
