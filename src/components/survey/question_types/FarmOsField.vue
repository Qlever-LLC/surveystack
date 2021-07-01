<template>
  <div class="farm-os-field">
    <app-control-label
      :value="control.label"
      :redacted="redacted"
      :required="required"
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
      :chips="this.control.options.hasMultipleSelections"
      :multiple="this.control.options.hasMultipleSelections"
      @keyup.enter.prevent="submit"
      :loading="loading"
    >
      <template
        v-slot:selection="data"
        v-if="!!control.options.hasMultipleSelections"
      >
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
      <template
        v-slot:selection="{item}"
        v-else
      >
        <div
          v-html="item.label"
          class="d-flex align-center autocomplete-selection"
        ></div>
      </template>

      <template
        v-slot:item="data"
        v-if="!!control.options.hasMultipleSelections"
      >
        <v-list-item-content>
          <v-list-item-title v-html="data.item.label" />
        </v-list-item-content>
      </template>
      <template
        v-slot:item="{item}"
        v-else
      >
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
  mixins: [baseQuestionComponent, farmosBase('fields')],
  data() {
    return {
    };
  },
  methods: {
    remove(item) {
      const isNotItem = v => JSON.stringify(v) !== JSON.stringify(item.value);
      this.changed(
        this.getValueOrNull(this.value.filter(isNotItem)),
      );
    },
  },
  async created() {
    await this.fetchAreas();
  },
};
</script>

<style scoped>
div >>> .blue-chip,
div >>> .orange-chip,
div >>> .green-chip {
  display: inline-flex;
  border: 1px #466cb3 solid;
  background: none;
  color: #466cb3;
  border-radius: 0.4rem;
  font-weight: bold;
  font-size: 80%;
  padding: 0.2rem;
  padding-left: 0.4rem;
  padding-right: 0.4rem;
  vertical-align: middle;
  margin-top: 0.4rem;
  margin-bottom: 0.4rem;
}

div >>> .green-chip {
  color: #46b355;
  border: 1px #46b355 solid;
}

div >>> .orange-chip {
  color: #f38d49;
  border: 1px #f38d49 solid;
}
</style>
