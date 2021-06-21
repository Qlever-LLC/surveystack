<template>
  <div>
    <app-control-label
      :value="control.label"
      :redacted="redacted"
      :required="required"
    />
    <v-autocomplete
      :disabled="loading"
      :value="value"
      @change="onChange"
      :items="farms || []"
      item-text="label"
      item-value="value"
      outlined
      :chips="false"
      :label="control.hint"
      :multiple="false"
      @keyup.enter.prevent="submit"
      :loading="loading"
    >
      <template v-slot:item="{item}">
        <div v-html="item.label"></div>
      </template>
      <template v-slot:selection="{item}">
        <div
          v-html="item.label"
          class="d-flex align-center"
        ></div>
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
  data() {
    return {
      farms: [],
    };
  },
  async created() {
    await this.fetchFarms();
  },
  methods: {
    fetch,
  },
};
</script>
