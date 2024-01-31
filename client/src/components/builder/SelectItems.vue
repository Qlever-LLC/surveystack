<template>
  <a-dialog v-model="open" width="500">
    <template v-slot:activator="{ props }">
      <a-text-field
        v-bind="props"
        :modelValue="getLabel"
        @update:modelValue="onChange"
        label="Default value"
        class="mt-3"
        clearable
        hide-details
        readonly
        :disabled="getDisabled" />
    </template>

    <a-card>
      <a-card-title class="text-grey-darken-2"> Default value </a-card-title>

      <a-card-text cssDialogContent>
        <div v-if="multiple" class="checkbox-group">
          <a-checkbox
            v-for="(item, index) in items"
            :key="index"
            v-model="selected"
            :label="item.label"
            :selected-item="item.value"
            class="mt-2"
            hide-details />
          <a-checkbox v-if="custom" v-model="selected" label="other" selected-item="other" class="mt-2" hide-details />
        </div>
        <a-radio-group v-else :modelValue="selected ? selected[0] : null" @update:modelValue="selected = [$event]">
          <a-radio v-for="(item, index) in items" :key="index" :label="item.label" :value="item.value" />
          <a-radio v-if="custom" label="other" value="other" />
        </a-radio-group>
      </a-card-text>

      <a-divider />

      <a-card-actions>
        <a-spacer />
        <a-btn variant="text" @click="cancel">Cancel</a-btn>
        <a-btn color="primary" @click="save">Save</a-btn>
      </a-card-actions>
    </a-card>
  </a-dialog>
</template>

<script>
function getArrayValue(source) {
  return Array.isArray(source) ? [...source] : source ? [source] : [];
}

export default {
  props: {
    modelValue: { type: [String, Array] },
    items: { type: Array, default: () => [] },
    custom: { type: Boolean },
    multiple: { type: Boolean },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      open: false,
      selected: null,
    };
  },
  computed: {
    getLabel() {
      if (!this.selected) {
        return undefined;
      }

      return this.selected
        .map((item) => {
          const match = this.items.find((i) => i.value === item);
          return match ? match.label : item;
        })
        .join(', ');
    },
    getDisabled() {
      return !this.custom && this.items.length === 0;
    },
  },
  methods: {
    onChange(val) {
      if (!val) {
        this.selected = null;
        this.$emit('update:modelValue', null);
      }
    },
    close() {
      this.open = false;
    },
    cancel() {
      this.selected = getArrayValue(this.modelValue);
      this.close();
    },
    save() {
      this.$emit('update:modelValue', this.selected);
      this.close();
    },
  },
  watch: {
    open(val) {
      if (val) {
        this.selected = getArrayValue(this.modelValue);
      } else {
        this.cancel();
      }
    },
  },
  created() {
    this.selected = getArrayValue(this.modelValue);
  },
};
</script>

<style scoped lang="scss">
.checkbox-group >>> .v-input--selection-controls {
  margin-top: 4px;
}
</style>
