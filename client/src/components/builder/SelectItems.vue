<template>
  <v-dialog v-model="open" width="500" @click:outside="cancel">
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
          <v-checkbox v-if="custom" v-model="selected" label="other" value="other" class="mt-2" hide-details />
        </div>
        <v-radio-group v-else :value="selected ? selected[0] : null" @change="selected = [$event]">
          <v-radio v-for="(item, index) in items" :key="index" :label="item.label" :value="item.value" />
          <v-radio v-if="custom" label="other" value="other" />
        </v-radio-group>
      </v-card-text>

      <a-divider />

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="cancel">Cancel</v-btn>
        <v-btn color="primary" @click="save">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import ATextField from '@/components/ui/ATextField.vue';

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
  components: {
    ATextField,
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
