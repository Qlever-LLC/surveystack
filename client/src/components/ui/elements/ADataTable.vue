<template>
  <v-data-table
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    :headers="headers"
    :items="items"
    :item-key="itemKey"
    :loading="loading"
    :search="search"
    :show-select="showSelect">
    <template v-if="labelSlot" v-slot:item.label="{ item }">
      <slot name="label" :item="item" />
    </template>
    <template v-if="valueSlot" v-slot:item.value="{ item }">
      <slot name="value" :item="item" />
    </template>
    <template v-if="tagsSlot" v-slot:item.tags="{ item }">
      <slot name="tags" :item="item" />
    </template>
    <template v-if="actionsSlot" v-slot:item.actions="{ item }">
      <slot name="actions" :item="item" />
    </template>
    <template v-if="hideDefaultFooter" v-slot:bottom></template>
  </v-data-table>
</template>

<script>
export default {
  emits: ['update:modelValue'],
  props: {
    // Named slot set to true to render slot
    labelSlot: { type: Boolean, required: false },
    valueSlot: { type: Boolean, required: false },
    tagsSlot: { type: Boolean, required: false },
    actionsSlot: { type: Boolean, required: false },
    hideDefaultFooter: { type: Boolean, required: false },
    //vuetify props
    modelValue: { type: undefined, required: false },
    headers: { type: undefined, required: false },
    items: { type: undefined, required: false },
    itemKey: { type: String, required: false },
    loading: { type: [String, Boolean], required: false },
    search: { type: String, required: false },
    showSelect: { type: Boolean, required: false },
  },
};
</script>
