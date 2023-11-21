<template>
  <div class="farm-os-field">
    <app-control-label
      :value="control.label"
      :redacted="redacted"
      :required="required"
      :initializable="control.options.initialize && control.options.initialize.enabled"
      :is-modified="meta && !!meta.dateModified"
      @initialize="initialize"
    />
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
      :chips="this.control.options.hasMultipleSelections"
      :multiple="this.control.options.hasMultipleSelections"
      @keyup.native.enter.prevent="submit"
      :loading="loading"
      color="focus"
      selectionSlot
      itemSlot
      cssFlexWrap
    >
      <template v-slot:selection="data" v-if="!!control.options.hasMultipleSelections">
        <a-chip
          close
          v-bind="data.attrs"
          :input-value="data.selected"
          @click="clickOnChip(data)"
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
          <a-list-item-title v-html="data.item.label" />
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
import AListItemTitle from '@/components/ui/AListItemTitle.vue';

export default {
  components: { AListItemTitle },
  mixins: [baseQuestionComponent, farmosBase()],

  async created() {
    await this.fetchAreas();
  },
  methods: {
    clickOnChip(data) {
      data.select;
    },
  },
};
</script>

<style scoped>
div >>> .blue-chip,
div >>> .orange-chip,
div >>> .green-chip {
  display: inline-flex;
  border: 1px var(--v-focus-base) solid;
  color: var(--v-focus-base);
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

div >>> .green-chip {
  color: #46b355;
  border: 1px #46b355 solid;
}

div >>> .orange-chip {
  color: #f38d49;
  border: 1px #f38d49 solid;
}

>>> .v-list-item.v-list-item--active {
  color: var(--v-focus-base) !important;
}
</style>
