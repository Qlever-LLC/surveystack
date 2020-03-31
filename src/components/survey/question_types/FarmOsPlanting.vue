<template>
  <v-container fluid>
    <v-row>
      <!-- v-model="values" -->
      <v-autocomplete
        :disabled="loading"
        :value="value"
        @change="onChange"
        :items="farms || []"
        item-text="label"
        item-value="value"
        outlined
        :chips="false"
        :label="control.label"
        :multiple="false"
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

      <v-progress-circular
        v-if="loading"
        indeterminate
        color="primary"
        class="align-self-center ml-4 mb-8"
      >
      </v-progress-circular>
    </v-row>
  </v-container>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';
import farmosBase from './FarmOsBase';

export default {
  mixins: [baseQuestionComponent, farmosBase('assets')],
};
</script>

<style scoped>
</style>
