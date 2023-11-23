<template>
  <a-dialog v-model="open" width="500" @click:outside="cancel">
    <template v-slot:activator="{ on, attrs }">
      <a-text-field
        v-on="on"
        v-bind="attrs"
        @input="onChange"
        ref="anchorRef"
        label="Default value"
        :value="getLabel"
        :class="$vnode.data.staticClass"
        clearable
        hide-details
        readonly
        :disabled="getDisabled"
      />
    </template>

    <a-card>
      <a-card-title class="grey--text text--darken-2"> Default value </a-card-title>

      <a-card-text cssDialogContent>
        <div v-if="multiple" class="checkbox-group">
          <a-checkbox
            v-for="(item, index) in items"
            :key="index"
            v-model="selected"
            :label="item.label"
            :selected-item="item.value"
            class="mt-2"
            hide-details
          />
          <a-checkbox v-if="custom" v-model="selected" label="other" selected-item="other" class="mt-2" hide-details />
        </div>
        <a-radio-group v-else :value="selected ? selected[0] : null" @input="selected = [$event]">
          <a-radio v-for="(item, index) in items" :key="index" :label="item.label" :value="item.value" />
          <a-radio v-if="custom" label="other" value="other" />
        </a-radio-group>
      </a-card-text>

      <a-divider />

      <a-card-actions>
        <a-spacer />
        <v-btn text @click="cancel">Cancel</v-btn>
        <v-btn color="primary" @click="save">Save</v-btn>
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
    value: { type: [String, Array] },
    items: { type: Array, default: () => [] },
    custom: { type: Boolean },
    multiple: { type: Boolean },
  },

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
        this.$emit('input', null);
      }
    },
    close() {
      this.open = false;
      this.$refs.anchorRef.blur();
    },
    cancel() {
      this.selected = getArrayValue(this.value);
      this.close();
    },
    save() {
      this.$emit('input', this.selected);
      this.close();
    },
  },
  watch: {
    open(val) {
      if (val) {
        this.selected = getArrayValue(this.value);
      }
    },
  },
  created() {
    this.selected = getArrayValue(this.value);
  },
};
</script>

<style scoped>
.checkbox-group >>> .v-input--selection-controls {
  margin-top: 4px;
}
</style>
