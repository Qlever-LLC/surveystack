<template>
  <div class="farm-os-field">
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
      :multiple="this.control.options.hasMultipleSelections"
      @keyup.enter.prevent="submit"
      :loading="loading"
      color="focus"
      selectionSlot
      itemSlot
      cssFlexWrap>
      <template v-slot:selection="{ item, index }">
        <span v-html="item.props.title" />
      </template>
      <template v-slot:chip="{ props, item }">
        <a-chip v-bind="props" closable v-html="item.title" style="height: 50px" />
      </template>
      <template v-slot:item="{ props, item }">
        <a-list-item v-bind="props" :title="undefined">
          <a-list-item-title v-html="item.raw.label" />
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
  mixins: [baseQuestionComponent, farmosBase],

  async created() {
    await this.fetchAreas();
  },
};
</script>

<style scoped lang="scss">
:deep(.blue-chip, .orange-chip, .green-chip) {
  display: inline-flex;
  border: 1px rgb(var(--v-theme-focus)) solid;
  color: rgb(var(--v-theme-focus));
  border-radius: 0.6rem;
  font-weight: bold;
  font-size: 80%;
  padding: 0.2rem;
  padding-left: 0.4rem;
  padding-right: 0.2rem;
  vertical-align: middle;
  margin-top: 0.4rem;
  margin-bottom: 0.4rem;
  margin-right: 0.2rem !important;
}

:deep(.green-chip) {
  color: #46b355;
  border: 1px #46b355 solid;
}

:deep(.orange-chip) {
  color: #f38d49;
  border: 1px #f38d49 solid;
}

:deep(.v-list-item.v-list-item--active) {
  color: rgb(var(--v-theme-focus)) !important;
}
</style>
