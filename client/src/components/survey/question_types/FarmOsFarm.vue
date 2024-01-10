<template>
  <div>
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
      class="autocomplete"
      itemSlot>
      <template v-slot:chip="{ props, item }" v-if="!!control.options.hasMultipleSelections">
        <a-chip v-bind="props" closable>
          {{ item.title }}
        </a-chip>
      </template>
      <template v-slot:item="{ props, item }">
        <a-list-item v-bind="props">
          <a-list-item-title>{{ item.label }} </a-list-item-title>
        </a-list-item>
      </template>
    </a-select>
    <app-control-more-info :value="control.moreInfo" />
  </div>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';
import farmosBase from './FarmOsBase';

export default {
  mixins: [baseQuestionComponent, farmosBase()],

  async created() {
    await this.fetchFarms();
  },
};
</script>

<style scoped lang="scss">
>>> .v-list-item.v-list-item--active {
  color: rgb(var(--v-theme-focus)) !important;
}
</style>
