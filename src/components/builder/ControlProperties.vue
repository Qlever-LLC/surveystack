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

      <v-checkbox
        class="ma-0"
        color="blue"
        outlined
        v-if="control.type !== 'group'"
        v-model="control.required"
        label="Required"
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
            class="ma-0"
            color="blue"
            outlined
            v-model="relevance.enabled"
            label="Relevance Expression"
          />
          <v-spacer />
          <v-icon
            class="align-self-start"
            color="blue"
            @click="$emit('code-relevance')"
          >
            mdi-open-in-new
          </v-icon>
        </div>

        <div class="d-flex">

          <v-checkbox
            color="blue"
            class="ma-0"
            outlined
            v-model="calculate.enabled"
            label="Calculate Expression"
          />
          <v-spacer />
          <v-icon
            class="align-self-start"
            color="blue"
            @click="$emit('code-calculate')"
          >
            mdi-open-in-new
          </v-icon>
        </div>

        <div class="d-flex">
          <v-checkbox
            class="ma-0"
            color="blue"
            outlined
            v-model="constraint.enabled"
            label="Constraint Expression"
          />
          <v-spacer />
          <v-icon
            class="align-self-start"
            color="blue"
            @click="$emit('code-constraint')"
          >
            mdi-open-in-new
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
    calculate: {

    },
    relevance: {

    },
    constraint: {

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
