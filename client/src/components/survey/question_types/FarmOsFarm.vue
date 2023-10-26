<template>
  <div>
    <app-control-label :value="control.label" :redacted="redacted" :required="required" />
    <!-- TODO in Vue3 remove .native -->
    <a-select
      engineering="autocomplete"
      :disabled="loading"
      :value="getValue"
      @change="onChange"
      :items="farms || []"
      item-text="label"
      item-value="value"
      outlined
      :label="control.hint"
      :chips="control.options.hasMultipleSelections"
      :multiple="control.options.hasMultipleSelections"
      :deletable-chips="control.options.hasMultipleSelections"
      @keyup.native.enter.prevent="submit"
      :loading="loading"
      color="focus"
      class="autocomplete"
      selectionSlot
      itemSlot
    >
      <template v-slot:selection="data" v-if="!!control.options.hasMultipleSelections">
        <v-chip
          close
          v-bind="data.attrs"
          :input-value="data.selected"
          @click="clickOnChip(data)"
          @click:close="remove(data.item)"
        >
          <template v-slot:default>
            <span v-html="data.item.label" />
          </template>
        </v-chip>
      </template>
      <template v-slot:selection="{ item }" v-else>
        <div v-html="item.label" class="d-flex align-center autocomplete-selection"></div>
      </template>

      <template v-slot:item="data" v-if="!!control.options.hasMultipleSelections">
        <v-list-item-content>
          <v-list-item-title>{{ data.item.label }} </v-list-item-title>
        </v-list-item-content>
      </template>
      <template v-slot:item="{ item }" v-else>
        <div v-html="item.label"></div>
      </template>
    </a-select>
    <app-control-more-info :value="control.moreInfo" />
  </div>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';
import farmosBase from './FarmOsBase';
import ASelect from '@/components/ui/ASelect.vue';

export default {
  mixins: [baseQuestionComponent, farmosBase()],
  async created() {
    await this.fetchFarms();
  },
  components: {
    ASelect,
  },
  methods: {
    clickOnChip(data) {
      data.select;
    },
  },
};
</script>

<style scoped>
>>> .v-list-item.v-list-item--active {
  color: var(--v-focus-base) !important;
}
</style>
