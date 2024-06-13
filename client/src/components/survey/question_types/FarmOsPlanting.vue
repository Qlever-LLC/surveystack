<template>
  <div class="farm-os-planting">
    <div class="d-flex justify-space-between flex-wrap">
      <app-control-label
        :value="control.label"
        :redacted="redacted"
        :required="required"
        :initializable="control.options.initialize && control.options.initialize.enabled"
        :is-modified="meta && !!meta.dateModified"
        @initialize="initialize" />
      <a-btn rounded small variant="text" color="primary" class="align-self-center mb-3" @click="clearSelection">
        clear selection
      </a-btn>
    </div>
    <app-control-hint :value="control.hint" />

    <a-progress-circular v-if="loading" color="secondary" class="my-8" />

    <a-list
      v-if="!loading"
      :disabled="loading"
      style="overflow: auto"
      :selected="listSelection"
      :selectStrategy="!!control.options.hasMultipleSelections ? 'classic' : 'single-leaf'"
      @update:selected="localChange">
      <a-list-item
        v-for="(item, idx) in transformed"
        :value="hashItem(item)"
        :key="`item_${idx}`"
        dense
        :disabled="(!control.options.hasMultipleSelections && item.value.isField) || item.value?.isNotClickable">
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
          <a-list-item-title :class="item.value.isField && idx > 0 ? 'mt-4' : ''">
            {{ item.label }}
            <a-list-item-subtitle v-if="item.value.isField">
              {{ item.value.farmName }}
            </a-list-item-subtitle>
          </a-list-item-title>
        </template>
      </a-list-item>
    </a-list>
    <app-control-more-info :value="control.moreInfo" />
  </div>
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

      const fields = selectedItems.filter((item) => !!item.isField);

      // selected assets
      const assets = selectedItems.filter((item) => !item.isField);

      const assetsToSelect = fields.flatMap((field) =>
        this.transformed
          .filter((item) => !item.value.isField)
          .filter((item) => item.value.farmName === field.farmName)
          .filter((item) => item.value.location.some((loc) => loc.id === field.location.id))
      );

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
    clearSelection() {
      this.onChange(null);
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
