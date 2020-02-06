<template>
  <div>
    <v-form v-if="control">
      <v-text-field
        outlined
        v-model="control.name"
        label="Data name"
      />
      <v-text-field
        outlined
        v-model="control.label"
        label="Label"
      />

      <div
        v-if="!showAdvanced"
        class="d-flex justify-end"
      >
        <v-btn
          @click="showAdvanced = true"
          color="primary"
          small
          text
        >advanced</v-btn>
      </div>
      <div
        v-if="showAdvanced"
        class="mt-2"
      >
        <div class="d-flex justify-space-between">
          <v-card-title class="d-flex">Advanced Options</v-card-title>
          <v-icon @click.stop="showAdvanced = false">mdi-close</v-icon>
        </div>

        <div class="d-flex">

          <v-checkbox
            color="blue"
            outlined
            :value="hasCalculate"
            label="Calculate Expression"
          />
          <v-spacer />
          <v-icon
            color="blue"
            @click="$emit('code-calculate')"
          >
            mdi-code-not-equal-variant
          </v-icon>
        </div>

        <div class="d-flex">
          <v-checkbox
            color="blue"
            outlined
            :value="hasRelevance"
            label="Relevance Expression"
          />
          <v-spacer />
          <v-icon
            color="blue"
            @click="$emit('code-relevance')"
          >
            mdi-code-not-equal-variant
          </v-icon>
        </div>

      </div>
    </v-form>
    <div v-else>...</div>
  </div>
</template>
<script>
import { getAdvancedCodeTemplate } from '@/utils/surveys';

export default {
  props: {
    toggleCode: {
      required: true,
    },
    control: {
      required: false,
    },
    survey: {
      required: true,
    },
    hasRelevance: {

    },
    hasCalculate: {

    },
  },
  data() {
    return {
      showAdvanced: false,
    };
  },
  methods: {
    openAdvancedEditor() {
      // TODO: can't pass params to new window
      // Use Vuex maybe?
      this.$router.push({
        name: 'debug-monaco',
        params: {
          initialCode: getAdvancedCodeTemplate(this.survey),
        },
      });
    },
  },
};
</script>
