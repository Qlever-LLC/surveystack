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
          <h4 class="d-flex">Advanced Options</h4>
          <v-icon @click.stop="showAdvanced = false">mdi-close</v-icon>
        </div>

        <v-text-field
          outlined
          v-model="control.options.calculate"
          label="Calculate"
        />
        <v-text-field
          outlined
          v-model="control.options.relevance"
          label="Show question if"
        />

        <div class="d-flex justify-content-end">
          <div class="pa-4">
            <v-btn
              dark
              color="blue"
              @click="toggleCode()"
            >
              Code Editor
              <v-icon>mdi-code-tags</v-icon>
            </v-btn>
          </div>
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
