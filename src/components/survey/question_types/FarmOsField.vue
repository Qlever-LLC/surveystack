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
  mixins: [baseQuestionComponent, farmosBase('fields')],
  data() {
    return {
    };
  },
  async created() {
    await this.fetchAreas();
  },
};
</script>

<style>
.orange-chip,
.green-chip,
.blue-chip {
  display: inline-flex;
  border: 1px #466cb3 solid;
  background-color: white;
  color: #466cb3;
  border-radius: 0.4rem;
  font-weight: bold;
  font-size: 80%;
  padding: 0.2rem;
  padding-left: 0.4rem;
  padding-right: 0.4rem;
  vertical-align: middle;
}

.green-chip {
  color: #46b355;
  border: 1px #46b355 solid;
}

.orange-chip {
  color: #f38d49;
  border: 1px #f38d49 solid;
}
</style>
