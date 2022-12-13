<template>
  <v-dialog v-model="open" width="500" @click:outside="$refs.anchorRef.blur()">
    <template v-slot:activator="{ on, attrs }">
      <v-text-field
        ref="anchorRef"
        label="Default value"
        :value="getLabel"
        @input="onChange"
        :class="$vnode.data.staticClass"
        append-icon="mdi-menu-down"
        clearable
        hide-details
        readonly
        v-on="on"
        v-bind="attrs"
      />
    </template>

    <v-card>
      <v-card-title class="grey--text text--darken-2"> Default value </v-card-title>

      <v-card-text class="dialog-content">
        <div v-if="multiple" class="checkbox-group">
          <v-checkbox
            v-for="(item, index) in items"
            :key="index"
            v-model="selected"
            :label="item.label"
            :value="item.value"
            class="mt-2"
            hide-details
          />
          <v-checkbox v-if="custom" v-model="selected" label="Other" value="other" class="mt-2" hide-details />
        </div>
        <v-radio-group v-else v-model="selected">
          <v-radio v-for="(item, index) in items" :key="index" :label="item.label" :value="item.value" />
          <v-radio v-if="custom" label="Other" value="other" />
        </v-radio-group>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="close">Cancel</v-btn>
        <v-btn color="primary" @click="save">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
function getValue(source, multiple) {
  const aryValue = Array.isArray(source) ? [...source] : source ? [source] : [];
  return multiple ? aryValue : aryValue[0];
}

export default {
  props: {
    value: {
      type: [String, Array],
    },
    items: {
      type: Array,
      default: () => [],
    },
    custom: {
      type: Boolean,
    },
    multiple: {
      type: Boolean,
    },
  },
  data() {
    return {
      open: false,
      selected: null,
    };
  },
  computed: {
    getLabel() {
      if (this.multiple) {
        return this.selected
          ? this.selected
              .map((item) => {
                const match = this.items.find((i) => i.value === item.value);
                return match ? match.label : item;
              })
              .join(', ')
          : undefined;
      }
      const match = this.items.find((item) => item.value === this.selected);
      if (match) {
        return match.label;
      }
      return this.value || undefined;
    },
  },
  methods: {
    onChange(val) {
      if (!val) {
        this.$emit('input', null);
      }
    },
    close() {
      this.open = false;
      this.$refs.anchorRef.blur();
    },
    save() {
      this.$emit('input', this.selected);
      this.close();
    },
  },
  watch: {
    open() {
      this.selected = getValue(this.value, this.multiple);
    },
    value(newVal) {
      this.selected = getValue(newVal, this.multiple);
    },
  },
  created() {
    this.selected = getValue(this.value, this.multiple);
  },
};
</script>

<style scoped>
.checkbox-group >>> .v-input--selection-controls {
  margin-top: 4px;
}
</style>
