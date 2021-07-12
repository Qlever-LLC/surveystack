<template>
  <div>
    <app-control-label :value="control.label" :redacted="redacted" :required="required" />
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
    >
      <template v-slot:selection="data" v-if="!!control.options.hasMultipleSelections">
        <v-chip
          close
          v-bind="data.attrs"
          :input-value="data.selected"
          @click="data.select"
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

export default {
  mixins: [baseQuestionComponent, farmosBase()],
  async created() {
    await this.fetchFarms();
  },
};
</script>
