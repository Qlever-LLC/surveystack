<template>
  <app-control-label
    :value="control.label"
    :redacted="redacted"
    :required="required"
    :initializable="control.options.initialize && control.options.initialize.enabled"
    :is-modified="meta && !!meta.dateModified"
    @initialize="initialize" />
  <a-select
    :disabled="loading"
    :modelValue="getValue"
    @update:modelValue="localChange"
    :items="transformed"
    item-title="label"
    item-value="value"
    variant="outlined"
    :label="control.hint"
    :multiple="control.options.hasMultipleSelections"
    @keyup.enter.prevent="submit"
    :loading="loading"
    color="focus"
    clearable
    :selectionSlot="!control.options.hasMultipleSelections"
    :chipSlot="control.options.hasMultipleSelections"
    itemSlot
    cssFlexWrap>
    <template v-slot:selection="{ props, item }">
      <span v-bind="props" v-html="item.raw.label" />
    </template>
    <template v-slot:chip="{ props, item }">
      <a-chip v-bind="props" closable style="margin-top: -3px">
        <span>{{ item.raw.label }}</span>
      </a-chip>
    </template>
    <template v-slot:item="{ props, item, index }">
      <a-list-item
        v-bind="props"
        :title="undefined"
        :key="`item_${index}`"
        :disabled="!control.options.hasMultipleSelections && item.value.isField">
        <template v-slot:prepend="{ isSelected }">
          <a-list-item-action class="ml-2 mr-2" v-if="!item.value.isField">
            <a-checkbox
              v-if="control.options.hasMultipleSelections"
              :modelValue="isSelected"
              color="focus"
              hide-details />
            <a-radio-group v-else :modelValue="isSelected" hide-details>
              <a-radio :value="true" color="focus" />
            </a-radio-group>
          </a-list-item-action>
          <a-list-item-title>
            {{ item.raw.label }}
            <a-list-item-subtitle v-if="item.value.isField">
              {{ item.value.farmName }}
            </a-list-item-subtitle>
          </a-list-item-title>
        </template>
      </a-list-item>
    </template>
  </a-select>
  <app-control-more-info :value="control.moreInfo" />
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';
import farmosBase from './FarmOsBase';
import AListItemSubtitle from '@/components/ui/elements/AListItemSubtitle.vue';

export default {
  components: { AListItemSubtitle },
  mixins: [baseQuestionComponent, farmosBase],
  data: () => ({
    transformed: [],
  }),
  async created() {
    await this.fetchAssets();
    this.transformed = this.transform(this.assets);
  },
  computed: {
    listSelection() {
      if (this.modelValue === null && this.control.options.hasMultipleSelections) {
        return [];
      }
      if (this.modelValue !== null && !this.control.options.hasMultipleSelections) {
        return [this.hashItem({ value: this.modelValue[0] })];
      }
      if (this.control.options.hasMultipleSelections && Array.isArray(this.modelValue)) {
        return this.modelValue.map((v) => this.hashItem({ value: v }));
      }
      return null;
    },
  },
  methods: {
    localChange(hashesArg) {
      let hashes;
      if (!Array.isArray(hashesArg)) {
        if (hashesArg) {
          hashes = [hashesArg];
        } else {
          this.onChange(null);
          return;
        }
      } else {
        hashes = hashesArg;
      }

      const selectedItems = hashes.map((h) => {
        if (typeof h !== 'string') {
          return h;
        }

        const foundTransformed = this.transformed.find((t) => t.value.hash === h);
        return foundTransformed.value;
      });

      // selected fields
      const fields = selectedItems.filter((item) => !!item.isField);
      // selected assets
      const assets = selectedItems.filter((item) => !item.isField);
      // if fields are selected, select all assets of these fields
      const assetsToSelect = fields.flatMap((field) =>
        this.transformed
          .filter((item) => !item.value.isField)
          .filter((item) => item.value.farmName === field.farmName)
          .filter((item) => item.value.location.some((loc) => loc.id === field.location.id))
      );
      // add single assets selected
      assetsToSelect.forEach((assetToSelect) => {
        if (
          assets.some((asset) => asset.farmName === assetToSelect.value.farmName && asset.id === assetToSelect.value.id)
        ) {
          // skip
        } else {
          assets.push(assetToSelect.value);
        }
      });

      if (!Array.isArray(hashesArg)) {
        this.onChange(assets[0]);
      } else {
        this.onChange(assets);
      }
    },
  },
};
</script>

<style scoped lang="scss">
.chip-no-wrap {
  white-space: nowrap;
}

.v-list-item--disabled {
  opacity: 1;
}
</style>
