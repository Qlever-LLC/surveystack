<template>
  <div>
    <v-card-title class="pl-0">Properties</v-card-title>

    <v-form v-if="control">
      <v-text-field
        outlined
        v-model="control.name"
        label="Data name"
        :disabled="!!control.libraryId && !control.isLibraryRoot"
        :rules="[nameIsUnique, nameHasValidCharacters, nameHasValidLength]"
      />
      <v-text-field
        outlined
        v-model="control.label"
        label="Label"
      />
      <v-text-field
        outlined
        v-model="control.hint"
        label="Hint"
      />
      <v-text-field
        outlined
        v-model="control.moreInfo"
        label="More info"
      />
      <div
        class="d-flex align-start"
        v-if="isScript"
      >
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
        <v-btn
          icon
          class="mt-2"
          @click="(ev) => $emit('set-script-editor-is-visible', true)"
        >
          <v-icon>mdi-open-in-new</v-icon>
        </v-btn>
        <!-- <v-btn
          icon
          class="mt-2"
          @click="refreshScript"
        >
          <v-icon>mdi-refresh</v-icon>
        </v-btn> -->
      </div>
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
        outlined
        v-if="showRequiredOption"
        v-model="control.options.required"
        label="Required"
        color="grey darken-1"
        hide-details
        :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
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
        color="grey darken-1"
        v-model="control.options.redacted"
        label="Private"
        :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
      >
        <template slot="label">
          <div>
            <div class="text--primary">Private</div>
            <div class="body-2">Only admins and original submitters can see this field</div>
          </div>
        </template>
      </v-checkbox>

      <v-checkbox
        class="my-1"
        color="grey darken-1"
        v-if="survey.meta.isLibrary"
        v-model="control.options.allowHide"
        hide-details
        label="Allow hide"
      >
        <template slot="label">
          <div>
            <div class="text--primary">Allow hide</div>
            <div class="body-2">Allow users of this question set to hide this question</div>
          </div>
        </template>
      </v-checkbox>

      <v-checkbox
        class="my-1"
        color="grey darken-1"
        v-if="survey.meta.isLibrary"
        v-model="control.options.allowModify"
        hide-details
        label="Allow modify"
      >
        <template slot="label">
          <div>
            <div class="text--primary">Allow modify</div>
            <div class="body-2">Allow users of this question set to modify this question</div>
          </div>
        </template>
      </v-checkbox>

      <v-checkbox
        class="my-1"
        color="grey darken-1"
        v-if="control.libraryId && control.options.allowHide"
        v-model="control.options.hidden"
        hide-details
        label="Hidden"
      >
        <template slot="label">
          <div>
            <div class="text--primary">Hidden</div>
            <div class="body-2">Submitters can not see this field. This option is intentionally allowed by the question set designer</div>
          </div>
        </template>
      </v-checkbox>

      <v-checkbox
        class="ma-0"
        color="grey darken-1"
        v-model="control.options.allowCustomSelection"
        v-if="isSelect || isOntology"
        outlined
        label="Allow Custom Entry"
        :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
      />

      <v-checkbox
        class="ma-0"
        v-model="control.options.hasMultipleSelections"
        v-if="control.type === 'ontology' || control.type === 'farmOsPlanting'"
        label="Allow Multiple Selections"
        :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
      />

      <v-select
        v-if="isDate"
        :items="dateTypes"
        label="Type"
        v-model="control.options.subtype"
        outlined
        :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
      />

      <div
        v-if="!showAdvanced"
        class="d-flex justify-end mt-4"
      >
        <v-btn
          @click="showAdvanced = true"
          color="grey darken-1"
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
            color="grey darken-1"
            outlined
            v-model="relevance.enabled"
            label="Relevance Expression"
            :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
          />
          <v-spacer />
          <v-icon
            class="align-self-start"
            color="grey darken-1"
            @click="$emit('code-relevance')"
          >
            mdi-open-in-new
          </v-icon>
        </div>

        <div class="d-flex">
          <v-checkbox
            color="grey darken-1"
            class="ma-0"
            outlined
            v-model="calculate.enabled"
            label="Calculate Expression"
            :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
          />
          <v-spacer />
          <v-icon
            class="align-self-start"
            color="grey darken-1"
            @click="$emit('code-calculate')"
          >
            mdi-open-in-new
          </v-icon>
        </div>

        <div class="d-flex">
          <v-checkbox
            class="ma-0"
            color="grey darken-1"
            outlined
            v-model="constraint.enabled"
            label="Constraint Expression"
            :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
          />
          <v-spacer />
          <v-icon
            class="align-self-start"
            color="grey darken-1"
            @click="$emit('code-constraint')"
          >
            mdi-open-in-new
          </v-icon>
        </div>

        <div class="d-flex">
          <v-checkbox
            class="ma-0"
            color="grey darken-1"
            outlined
            v-model="apiCompose.enabled"
            label="Api Compose Expression"
            :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
          />
          <v-spacer />
          <v-icon
            class="align-self-start"
            color="grey darken-1"
            @click="$emit('code-api-compose')"
          >
            mdi-open-in-new
          </v-icon>
        </div>
      </div>
      <select-items-editor
        v-if="isSelect"
        v-model="control.options.source"
        :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
        class="mt-5"
      />
      <app-ontology-properties
        v-else-if="isOntology"
        :value="control.options.source"
        :resources="survey.resources"
        :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
        @set-control-source="(val) => $emit('set-control-source', val)"
        @set-survey-resources="(val) => $emit('set-survey-resources', val)"
        class="mt-5"
      />
      <app-matrix-properties
        v-else-if="isMatrix"
        v-model="control.options.source"
        :resources="survey.resources"
        :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
        @set-control-source="(val) => $emit('set-control-source', val)"
        @set-survey-resources="(val) => $emit('set-survey-resources', val)"
        class="mt-5"
        @set-control-required="control.options.required = true"
      />
      <instructions-editor
        v-else-if="isInstructions"
        v-model="control.options.source"
        :disabled="control.libraryId!=null"
      />
      <instructions-image-split-editor
        v-else-if="isInstructionsImageSplit"
        v-model="control.options.source"
        :resources="survey.resources"
        :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
        @set-survey-resources="(val) => $emit('set-survey-resources', val)"
        @set-control-source="(val) => $emit('set-control-source', val)"
      />
    </v-form>
    <div v-else>...</div>
  </div>
</template>
<script>
import { getAdvancedCodeTemplate, findParentByChildId } from '@/utils/surveys';
import api from '@/services/api.service';
import SelectItemsEditor from '@/components/builder/SelectItemsEditor.vue';
import appMatrixProperties from '@/components/builder/MatrixProperties.vue';
import appOntologyProperties from '@/components/builder/OntologyProperties.vue';
import InstructionsEditor from '@/components/builder/TipTapEditor.vue';
import InstructionsImageSplitEditor from '@/components/builder/InstructionsImageSplitEditor.vue';

import { convertToKey } from '@/utils/builder';

export default {
  components: {
    SelectItemsEditor,
    InstructionsEditor,
    appOntologyProperties,
    appMatrixProperties,
    InstructionsImageSplitEditor,
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
    apiCompose: {

    },
    survey: {
      required: true,
    },
    source: {
      type: String,
    },
    controls: {
      type: Array,
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
      dateTypes: [
        {
          text: 'Full Date (Month, Day, and Year)',
          value: 'date',
        },
        {
          text: 'Month and Year Only',
          value: 'date-month-year',
        },
        {
          text: 'Year Only',
          value: 'date-year',
        },
        {
          text: 'Week of Month and Year',
          value: 'date-week-month-year',
        },
        // {
        //   text: 'Year Only',
        //   value: 'date-year',
        // },
      ],
      // nameRules: {
      //   // const pat = new RegExp(this.controlNames.join('|'));
      //   unique(val) {
      //     console.log(this.controlNames.some(name => name === val));
      //     return this.controlNames.some(name => name === val) ? true : 'date name must be unique';
      //   },
      // },
    };
  },
  computed: {
    controlNames() {
      return this.controls.map(control => control.name);
    },
    isGroup() {
      return this.control.type === 'group';
    },
    isDate() {
      return this.control.type === 'date';
    },
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
    isMatrix() {
      return this.control.type === 'matrix';
    },
    isInstructionsImageSplit() {
      return this.control.type === 'instructionsImageSplit';
    },
    showRequiredOption() {
      if (this.control.options.required) {
        // if current state is required, add possibility to clear required
        return true;
      }

      if (['group', 'page', 'instructions', 'instructionsImageSplit'].includes(this.control.type)) {
        return false;
      }

      return true;
    },
  },
  methods: {
    log(v) {
      console.log(v);
    },
    nameIsUnique(val) {
      const hasSameNameAndDifferentId = control => control.name === this.control.name && control.id !== this.control.id;
      const parent = findParentByChildId(this.control.id, this.controls);

      const controlsWithSameName = parent
        ? parent.children.filter(hasSameNameAndDifferentId)
        : this.controls.filter(hasSameNameAndDifferentId);
      return controlsWithSameName.length > 0
        ? 'Data name must be unique'
        : true;
    },
    nameHasValidCharacters(val) {
      const namePattern = /^[\w]*$/;
      return namePattern.test(val) ? true : 'Data name must only contain valid charcters';
    },
    nameHasValidLength(val) {
      const namePattern = /^.{1,}$/; // one character should be ok, especially within groups
      return namePattern.test(val) ? true : 'Data name must be at least 1 characters in length';
    },
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
    refreshScript() {
      this.fetchScripts();
      this.$emit('set-control-source', null);
    },
  },
  watch: {
    'control.name': {
      handler(newVal, oldVal) {
        const key = convertToKey(newVal);
        // console.log(`setting control.name to "${key}"`);
        this.control.name = key;
      },
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
