<template>
  <div>
    <app-control-label
      :value="control.label"
      :redacted="redacted"
      :required="required"
      :initializable="control.options.initialize && control.options.initialize.enabled"
      :is-modified="meta && !!meta.dateModified"
      @initialize="initialize"
    />
    <v-autocomplete
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
      @keyup.enter.prevent="submit"
      :loading="loading"
      color="focus"
      class="autocomplete"
    >
      <template v-slot:selection="data" v-if="!!control.options.hasMultipleSelections">
        <a-chip
          close
          v-bind="data.attrs"
          :input-value="data.selected"
          @click="data.select"
          @click:close="remove(data.item)"
        >
          <template v-slot:default>
            <span v-html="data.item.label" />
          </template>
        </a-chip>
      </template>
      <template v-slot:selection="{ item }" v-else>
        <div v-html="item.label" class="d-flex align-center autocomplete-selection"></div>
      </template>

      <template v-slot:item="data" v-if="!!control.options.hasMultipleSelections">
        <v-list-item-content>
          <v-list-item-title v-html="data.item.label" />
        </v-list-item-content>
      </template>
      <template v-slot:item="{ item }" v-else>
        <div v-html="item.label"></div>
      </template>
    </v-autocomplete>
    <app-control-more-info :value="control.moreInfo" />
  </div>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';
import farmosBase from './FarmOsBase';
import AChip from '@/components/ui/AChip.vue';

export default {
  mixins: [baseQuestionComponent, farmosBase()],
  components: {
    AChip,
  },
  async created() {
    await this.fetchFarms();
  },
};
</script>

<style scoped>
>>> .v-list-item.v-list-item--active {
  color: var(--v-focus-base) !important;
}
</style>
