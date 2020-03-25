<template>
  <div>
    <v-card-title class="pl-0">Properties</v-card-title>

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
      <v-autocomplete
        v-model="scriptSourceId"
        v-if="isScript"
        :items="scriptSourceItems"
        label="Script Source"
        item-text="name"
        item-value="_id"
        @focus="handleScriptSourceFocus"
        @change="(id) => $emit('set-control-source', id)"
        solo
        outlined
        chips
        persistent-hint
      >
        <template v-slot:selection="{ attr, on, item, selected }">
          <div>{{ item.name }}</div>
        </template>
      </v-autocomplete>
      <!-- TODO: allow params to be written JS style, instead of strict JSON, fix updating -->
      <v-textarea
        v-model="scriptParams"
        @change="handleScriptParamsChange"
        v-if="isScript"
        label="Parameters"
        :rules="[validateScriptParams]"
        outlined
      />
      <v-checkbox
        class="my-1"
        color="blue"
        outlined
        v-if="control.type !== 'group'"
        v-model="control.options.required"
        label="Required"
        hide-details
      >
        <template slot="label">
          <div>
            <div class="text--primary">Required</div>
            <div class="body-2">Make this a required field</div>
          </div>
        </template>
      </v-checkbox>

      <v-checkbox
        class="my-1"
        color="blue"
        v-model="control.options.redacted"
        label="Private"
      >
        <template slot="label">
          <div>
            <div class="text--primary">Private</div>
            <div class="body-2">Only admins and original submitters can see this field</div>
          </div>
        </template>
      </v-checkbox>

      <v-checkbox
        class="ma-0"
        v-model="control.options.allowCustomSelection"
        v-if="isSelect || isOntology"
        outlined
        label="Allow Custom Entry"
      />

      <v-checkbox
        class="ma-0"
        v-model="control.options.hasMultipleSelections"
        v-if="control.type === 'ontology'"
        label="Allow Multiple Selections"
      />

      <div
        v-if="!showAdvanced"
        class="d-flex justify-end mt-4"
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
      <select-items-editor
        v-if="isSelect || isOntology"
        v-model="control.options.source"
        class="mt-5"
      />

      <instructions-editor
        v-if="isInstructions"
        v-model="control.options.source"
      />
    </v-form>
    <div v-else>...</div>
  </div>
</template>
<script>
import { getAdvancedCodeTemplate } from '@/utils/surveys';
import api from '@/services/api.service';
import SelectItemsEditor from '@/components/builder/SelectItemsEditor.vue';
import InstructionsEditor from '@/components/builder/InstructionsEditor.vue';

export default {
  components: {
    SelectItemsEditor,
    InstructionsEditor,
  },
  props: {
    control: {
      required: false,
    },
    calculate: {

    },
    relevance: {

    },
    constraint: {

    },
    survey: {
      required: true,
    },
    source: {
      type: String,
    },
  },
  data() {
    return {
      showAdvanced: false,
      // if we migrate to using Vue Composition API, the script functionality could be extracted out into a `useScriptProperties` hook
      scriptSourceId: null,
      scriptParams: (this.control && this.control.options && JSON.stringify(this.control.options.params))
        || JSON.stringify({}),
      scriptSourceIsLoading: false,
      scriptSourceItems: [],
    };
  },
  computed: {
    isScript() {
      return this.control.type === 'script';
    },
    isInstructions() {
      return this.control.type === 'instructions';
    },
    isSelect() {
      return /select/i.test(this.control.type);
    },
    isOntology() {
      return this.control.type === 'ontology';
    },
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
    async fetchScripts() {
      // TODO: use Mongo project to limit results, only get script name and id,
      // so we're not fetching all the script bodies in the database.
      // Then fetch the body of the selected script once it's selected.
      this.scriptSourceIsLoading = true;
      const { data } = await api.get('/scripts');
      this.scriptSourceItems = data;
      this.scriptSourceIsLoading = false;
    },
    handleScriptSourceFocus() {
      this.fetchScripts();
    },
    handleScriptSourceChange(id) {
      this.$emit('set-control-source', id);
    },
    handleScriptParamsChange(params) {
      // TODO: review safety, security
      // Validate params is valid json object
      try {
        this.$emit('set-control-params', JSON.parse(params));
        // this.control.options.params = JSON.parse(params);
      } catch (error) {
        console.warn('script params not valid JSON', error);
      }
    },
    validateScriptParams(params) {
      try {
        JSON.parse(params);
      } catch (err) {
        return 'Invalid JSON';
      }
      return true;
    },
    handleSelectItemsChange(ev) {
      console.log('handleSelectItemsChange', ev);
    },
  },
  created() {
    if (this.isScript) {
      this.fetchScripts();
    }
    this.scriptSourceId = this.control.options.source;
  },
};
</script>
