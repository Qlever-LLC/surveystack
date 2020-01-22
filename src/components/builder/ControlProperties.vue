<template>
  <div>
    <v-form v-if="control">
      <v-text-field v-model="control.name" label="Data name" />
      <v-text-field v-model="control.label" label="Label" />

      <div v-if="!showAdvanced" class="d-flex justify-end">
        <v-btn @click="showAdvanced = true" color="primary" small text>advanced</v-btn>
      </div>
      <div v-if="showAdvanced" class="mt-2">
        <div class="d-flex justify-space-between">
          <h4 class="d-flex">Advanced Options</h4>
          <v-icon @click.stop="showAdvanced = false">mdi-close</v-icon>
        </div>

        <v-text-field v-model="control.options.calculate" label="Calculate" />
        <v-text-field v-model="control.options.relevance" label="Show question if" />

        <div class="d-flex justify-content-end">
          <small>
            <a @click.prevent="openAdvancedEditor" href="./editor">open in editor...</a>
          </small>
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
    control: {
      required: false,
    },
    survey: {
      required: true,
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
