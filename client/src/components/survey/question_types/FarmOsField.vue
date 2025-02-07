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
    @update:modelValue="onChange"
    :items="farms || []"
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
    <template v-slot:item="{ props, item }">
      <a-list-item v-bind="props" :title="undefined">
        <a-list-item-title v-html="item.raw.label" />
        <a-list-item-subtitle>
          {{ this.getFirstSectionOfFarmURL(item.raw.value.url) }}
        </a-list-item-subtitle>
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

  async created() {
    await this.fetchAreas();
  },
};
</script>

<style scoped lang="scss">
:deep(.v-list-item.v-list-item--active) {
  color: rgb(var(--v-theme-focus)) !important;
}
</style>
