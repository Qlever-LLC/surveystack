<template>
  <div class="property-panel">
    <v-card-title class="pl-0">Properties</v-card-title>
    <v-form v-if="control">
      <!-- Default properties -->
      <v-text-field v-model="control.label" label="Label" hide-details />
      <v-text-field
        v-model="control.name"
        label="Value"
        :disabled="!!control.libraryId && !control.isLibraryRoot"
        :rules="[nameIsUnique, nameHasValidCharacters, nameHasValidLength]"
        hide-details
      />
      <v-text-field v-model="control.hint" label="Hint" hide-details />
      <v-text-field v-model="control.moreInfo" label="More info" hide-details />

      <!-- Control properties -->
      <v-text-field
        v-if="isText"
        v-model="control.defaultValue"
        @blur="handleDefaultValueTrim"
        label="Default value"
        hide-details
      />
      <v-text-field
        v-if="isNumber"
        type="number"
        v-model="control.defaultValue"
        @blur="handleDefaultValueTrim"
        label="Default value"
        hide-details="auto"
        :rules="[isValidNumber]"
      />
      <instructions-editor
        v-if="isInstructions"
        v-model="control.options.source"
        class="mt-6"
        :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
      />
      <instructions-image-split-editor
        v-if="isInstructionsImageSplit"
        v-model="control.options.source"
        :resources="survey.resources"
        :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
        @set-survey-resources="(val) => $emit('set-survey-resources', val)"
        @set-control-source="(val) => $emit('set-control-source', val)"
      />
      <a-select
        v-if="isDate"
        :items="dateTypes"
        label="Type"
        v-model="control.options.subtype"
        @input="() => (control.defaultValue = null)"
        :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
        hide-details
      />
      <select-items-editor
        v-if="isSelect"
        v-model="control.options.source"
        @set-control-source="() => (control.defaultValue = null)"
        :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
        class="mt-3"
      />
      <ontology-properties
        v-if="isOntology"
        :value="control.options.source"
        :resources="survey.resources"
        :disable-selection="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
        @set-control-source="(val) => $emit('set-control-source', val)"
        @set-survey-resources="(val) => $emit('set-survey-resources', val)"
      />
      <v-text-field
        v-if="isMatrix"
        v-model="control.options.source.config.addRowLabel"
        label="Add Row label"
        hide-details
      />
      <matrix-properties
        v-if="isMatrix"
        v-model="control.options.source"
        :resources="survey.resources"
        :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
        :allowSetAllowHide="!!survey.meta.isLibrary"
        @set-control-source="(val) => $emit('set-control-source', val)"
        @set-survey-resources="(val) => $emit('set-survey-resources', val)"
        @set-control-required="control.options.required = true"
        class="mt-3"
      />
      <a-select
        v-if="this.control.type === 'file'"
        label="Restrict uploaded file types (.csv, .pdf, etc.)"
        v-model="control.options.source.types"
        :items="fileTypes"
        :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
        multiple
        chips
        clearable
        deletable-chips
        hide-details
      />
      <v-autocomplete
        v-if="isScript"
        label="Script Source"
        v-model="scriptSourceId"
        :items="scriptSourceItems"
        item-text="name"
        item-value="_id"
        append-outer-icon="mdi-open-in-new"
        @click:append-outer="() => $emit('set-script-editor-is-visible', true)"
        @focus="handleScriptSourceFocus"
        @change="handleScriptSourceChange"
        :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
        hide-details
      >
        <template v-slot:selection="{ item }">
          <div>{{ item.name }}</div>
        </template>
      </v-autocomplete>
      <v-text-field v-if="isScript" v-model="control.options.buttonLabel" label="Run Button Label" hide-details />
      <!-- TODO: allow params to be written JS style, instead of strict JSON, fix updating -->
      <v-textarea
        v-if="isScript"
        v-model="scriptParams"
        @input="handleScriptParamsChange"
        label="Parameters"
        :rules="[validateScriptParams]"
        :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
        class="pt-3"
        hide-details
      />
      <v-combobox
        v-if="isFarmOsUuid"
        label="FarmOS Type"
        v-model="control.options.farmOsType"
        @input="handleFarmOsTypeChange"
        :items="control.options.farmOsTypes"
        :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
      />
      <checkbox
        v-if="control.type === 'ontology'"
        class="ml-2"
        label="Multiple select"
        v-model="control.options.hasMultipleSelections"
        :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
        dense
      />
      <checkbox
        v-if="isSelect || isOntology"
        class="ml-2"
        label="Allow custom answer"
        v-model="control.options.allowCustomSelection"
        @input="
          () => {
            control.options.allowAutocomplete = true;
            control.defaultValue = null;
          }
        "
        :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
        dense
      >
        <template slot="helper-text">
          Allows the user to input answers that do not exist within the provided items.
          <span v-if="isOntology">This will also require <strong>Autocomplete</strong> is on</span>
        </template>
      </checkbox>
      <checkbox
        v-if="isOntology"
        class="ml-2"
        label="Autocomplete"
        v-model="control.options.allowAutocomplete"
        :disabled="
          (!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot) ||
          control.options.allowCustomSelection
        "
        helper-text="Provides selectable suggestions as a user types into it. It allows users to quickly search through and select from large collections of options"
        dense
      />
      <ontology
        v-if="isOntology"
        v-model="control.defaultValue"
        :multiple="control.options.hasMultipleSelections"
        :customAnswer="control.options.allowCustomSelection"
        :autocomplete="control.options.allowAutocomplete"
        :source="control.options.source"
        :resources="survey.resources"
      />
      <date
        v-if="isDate && control.options.subtype"
        v-model="control.defaultValue"
        @input="() => $forceUpdate()"
        @blur="handleDefaultValueTrim"
        :type="control.options.subtype"
        class="mt-3"
      />
      <select-items
        v-if="isSelect && control.options.source"
        v-model="control.defaultValue"
        @blur="handleDefaultValueTrim"
        :items="control.options.source"
        :custom="control.options.allowCustomSelection"
        :multiple="control.type === 'selectMultiple'"
        class="mt-3"
      />

      <!-- Control options -->
      <v-spacer></v-spacer>
      <checkbox
        v-if="hasRequiredOption"
        label="Required"
        v-model="control.options.required"
        :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
        helper-text="Make this a required field"
      />
      <checkbox
        label="Private"
        v-model="control.options.redacted"
        :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
        helper-text="Only admins and original submitters can see this field"
      />
      <checkbox
        v-if="isPage"
        label="Compact"
        v-model="control.options.compact"
        helper-text="Reduce the spaces and combine fields into one card"
      />
      <checkbox
        v-if="isText"
        label="QR Code"
        v-model="control.options.enableQr"
        :disabled="!!control.libraryId && !control.isLibraryRoot"
      />
      <checkbox
        v-if="survey.meta.isLibrary && !control.libraryIsInherited && !control.libraryId"
        label="Allow modify"
        v-model="control.options.allowModify"
        helper-text="Allow users of this question set to modify this question"
      />
      <checkbox
        v-if="survey.meta.isLibrary && !control.libraryIsInherited && !control.libraryId"
        label="Allow hide"
        v-model="control.options.allowHide"
        helper-text="Allow users of this question set to hide this question"
      />
      <checkbox
        v-if="control.libraryId && control.options.allowHide"
        label="Hidden"
        v-model="control.options.hidden"
        helper-text="Submitters can not see this field. This option is intentionally allowed by the question set designer"
      />
      <checkbox
        v-if="control.type === 'farmOsPlanting' || control.type === 'farmOsFarm' || control.type === 'farmOsField'"
        label="Multiple select"
        v-model="control.options.hasMultipleSelections"
        :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
      />
      <checkbox
        v-if="isFile"
        label="Multiple upload"
        v-model="control.options.source.allowMultiple"
        helper-text="Allow user to upload multiple files"
      />
      <checkbox
        v-if="control.type === 'script'"
        label="Native Script"
        v-model="control.options.isNativeScript"
        :disabled="!!control.libraryId && !control.isLibraryRoot"
        helper-text="Show Download Link for Surveystack Kit APK"
      />
      <template v-if="isGeoJSON">
        <checkbox
          v-for="opt in geoJsonOptions"
          :key="opt.key"
          :label="opt.text"
          v-model="control.options.geoJSON[opt.key]"
        />
      </template>

      <!-- Advanced properties -->
      <v-btn v-if="!showAdvanced" color="grey darken-1" class="align-self-end" @click="showAdvanced = true" small text>
        Advanced
      </v-btn>
      <div v-else class="extra-options">
        <v-spacer></v-spacer>
        <div>
          <v-card-title class="px-0 py-0">Advanced Options</v-card-title>
          <v-icon @click.stop="showAdvanced = false">mdi-close</v-icon>
        </div>

        <div>
          <checkbox
            label="Relevance Expression"
            v-model="relevance.enabled"
            :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
          />
          <v-icon color="grey darken-1" @click="$emit('code-relevance')" size="20"> mdi-open-in-new </v-icon>
        </div>

        <div>
          <checkbox
            label="Calculate Expression"
            v-model="calculate.enabled"
            :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
          />
          <v-icon class="align-self-start" color="grey darken-1" @click="$emit('code-calculate')" size="20">
            mdi-open-in-new
          </v-icon>
        </div>

        <div>
          <checkbox
            label="Constraint Expression"
            v-model="constraint.enabled"
            :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
          />
          <v-icon class="align-self-start" color="grey darken-1" @click="$emit('code-constraint')" size="20">
            mdi-open-in-new
          </v-icon>
        </div>

        <div>
          <checkbox
            label="Api Compose Expression"
            v-model="apiCompose.enabled"
            :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
          />
          <v-icon class="align-self-start" color="grey darken-1" @click="$emit('code-api-compose')" size="20">
            mdi-open-in-new
          </v-icon>
        </div>
      </div>

      <!-- Print layout -->
      <template v-if="hasLayoutOptions">
        <v-btn v-if="!showLayout" color="grey darken-1" class="align-self-end" @click="showLayout = true" small text>
          Print Layout
        </v-btn>
        <div v-else class="extra-options">
          <v-spacer></v-spacer>
          <div>
            <v-card-title class="px-0 py-0">Print Layout</v-card-title>
            <v-icon @click.stop="showLayout = false">mdi-close</v-icon>
          </div>

          <div v-if="isMatrix">
            <checkbox
              label="Table format"
              v-model="control.options.printLayout.table"
              helper-text="Renders the matrix answers in tabular format. Otherwise, it is rendered in list format."
            />
          </div>

          <div v-if="isFile">
            <checkbox
              label="Show preview"
              v-model="control.options.printLayout.preview"
              helper-text="Render the uploaded images. JPEG and PNG formats are supported. By default, only links are rendered."
            />
          </div>

          <template v-if="isSelect || isOntology">
            <div>Blank Survey (from title page)</div>
            <div class="mt-2">
              <checkbox
                label="Show all resource list options"
                v-model="control.options.printLayout.showAllOptionsPrintable"
                helper-text="Show the complete list of possible options when printing a fresh survey"
              />
            </div>

            <div>Filled Submission</div>
            <div class="mt-2">
              <checkbox
                label="Show all resource list options"
                v-model="control.options.printLayout.showAllOptions"
                helper-text="Show the complete list of possible options when printing a completed survey submission, with the selected answer highlighted"
              />
            </div>

            <a-select
              label="Answer layout"
              v-model="control.options.printLayout.columns"
              :items="[1, 2, 3, 4, 5]"
              color="focus"
              :menu-props="{ contentClass: 'layout-select' }"
              hide-details
              selectionSlot
              itemSlot
              appendOuterSlot
            >
              <template v-slot:selection="{ item, index }">
                {{ item === 1 ? '1 column' : `${item} columns` }}
              </template>

              <template v-slot:item="{ item, on, attrs }">
                <div class="d-flex align-center col">
                  <div class="col-label">
                    {{ item === 1 ? '1 column' : `${item} columns` }}
                  </div>
                  <div class="ml-2" :class="`col-item cols-${item}`" v-on="on" v-bind="attrs">
                    <div v-for="letter in 'ABCDE'.split('')" :key="letter">
                      {{ letter }}
                    </div>
                  </div>
                </div>
              </template>

              <template #append-outer>
                <v-tooltip max-width="400" transition="slide-x-transition" right>
                  <template v-slot:activator="{ on, attrs }">
                    <v-icon v-bind="attrs" v-on="on" size="20">mdi-help-circle-outline</v-icon>
                  </template>
                  Set the number of items in a row
                </v-tooltip>
              </template>
            </a-select>
          </template>
        </div>
      </template>

      <v-spacer></v-spacer>
    </v-form>
  </div>
</template>
<script>
import { getAdvancedCodeTemplate, findParentByChildId } from '@/utils/surveys';
import { nameHasValidCharacters, nameHasValidLength } from '@/utils/resources';
import SelectItems from '@/components/builder/SelectItems.vue';
import SelectItemsEditor from '@/components/builder/SelectItemsEditor.vue';
import MatrixProperties from '@/components/builder/MatrixProperties.vue';
import OntologyProperties from '@/components/builder/OntologyProperties.vue';
import InstructionsEditor from '@/components/builder/TipTapEditor.vue';
import InstructionsImageSplitEditor from '@/components/builder/InstructionsImageSplitEditor.vue';
import Ontology from '@/components/builder/Ontology.vue';
import Date from '@/components/builder/Date.vue';
import Checkbox from '@/components/ui/Checkbox.vue';
import ASelect from '@/components/ui/ASelect.vue';
import api from '@/services/api.service';
import { getValueOrNull } from '@/utils/surveyStack';
import { convertToKey } from '@/utils/builder';

export default {
  components: {
    SelectItems,
    SelectItemsEditor,
    OntologyProperties,
    MatrixProperties,
    InstructionsEditor,
    InstructionsImageSplitEditor,
    Ontology,
    Date,
    Checkbox,
    ASelect,
  },
  props: {
    control: {
      required: false,
    },
    calculate: {},
    relevance: {},
    constraint: {},
    apiCompose: {},
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
      showLayout: false,
      // if we migrate to using Vue Composition API, the script functionality could be extracted out into a `useScriptProperties` hook
      scriptSourceId: null,
      scriptParams: this.getScriptParams(),
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
      ],
      fileTypes: [
        { text: 'PDF (.pdf)', value: 'application/pdf' },
        { text: 'Spreadsheets (.csv)', value: 'text/csv' },
        { text: 'Image (.gif, .png, .jpg, .jpeg)', value: 'image/*' },
        { text: 'Plain text (.txt)', value: 'text/plain' },
      ],
      geoJsonOptions: [
        {
          key: 'showPolygon',
          text: 'Show polygon control',
        },
        {
          key: 'showLine',
          text: 'Show line control',
        },
        {
          key: 'showPoint',
          text: 'Show point control',
        },
        {
          key: 'showCircle',
          text: 'Show circle control',
        },
      ],
    };
  },
  computed: {
    controlNames() {
      return this.controls.map((control) => control.name);
    },
    isGroup() {
      return this.control.type === 'group';
    },
    isFile() {
      return this.control.type === 'file' || this.control.type === 'image';
    },
    isDate() {
      return this.control.type === 'date';
    },
    isText() {
      return this.control.type === 'string';
    },
    isNumber() {
      return this.control.type === 'number';
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
    isGeoJSON() {
      return this.control.type === 'geoJSON';
    },
    isInstructionsImageSplit() {
      return this.control.type === 'instructionsImageSplit';
    },
    isPage() {
      return this.control.type === 'page';
    },
    isFarmOsUuid() {
      return this.control.type === 'farmOsUuid';
    },
    hasRequiredOption() {
      return (
        this.control.options.required ||
        !['group', 'page', 'instructions', 'instructionsImageSplit'].includes(this.control.type)
      );
    },
    hasLayoutOptions() {
      return this.isSelect || this.isOntology || this.isFile || this.isMatrix;
    },
  },
  methods: {
    nameIsUnique() {
      const hasSameNameAndDifferentId = (control) =>
        control.name === this.control.name && control.id !== this.control.id;
      const parent = findParentByChildId(this.control.id, this.controls);

      const controlsWithSameName = parent
        ? parent.children.filter(hasSameNameAndDifferentId)
        : this.controls.filter(hasSameNameAndDifferentId);
      return controlsWithSameName.length > 0 ? 'Value must be unique' : true;
    },
    nameHasValidCharacters,
    nameHasValidLength,
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
      // TODO: use Mongo project to limit results, only get script name and id
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
      if (!id) {
        //no script selected
        return;
      }
      const name = this.scriptSourceItems.find((i) => i._id === id).name;
      this.$emit('set-control-source', {
        id: id,
        name: name,
      });
    },
    handleScriptParamsChange(params) {
      // Validate params is valid json object
      try {
        this.$emit('set-control-params', JSON.parse(params));
      } catch (error) {
        console.warn('script params not valid JSON', error);
      }
    },
    handleDefaultValueTrim() {
      const value = this.control.defaultValue;
      this.control.defaultValue = getValueOrNull(Array.isArray(value) ? value.map(getValueOrNull) : value);
    },
    handleFarmOsTypeChange(type) {
      this.control.options.farmOsType = getValueOrNull(type);
    },
    validateScriptParams(params) {
      try {
        JSON.parse(params);
      } catch (err) {
        return 'Invalid JSON';
      }
      return true;
    },
    isValidNumber(val) {
      return val === '' || val === null || isNaN(Number(val)) ? 'Please enter a number' : true;
    },
    getScriptParams() {
      return (
        (this.control && this.control.options && JSON.stringify(this.control.options.params)) || JSON.stringify({})
      );
    },
    updateScript() {
      if (this.isScript) {
        this.fetchScripts();
      }
      const scriptResource = this.survey.resources.find((r) => r.id === this.control.options.source);
      if (scriptResource) {
        this.scriptSourceId = scriptResource.content;
      } else {
        //fallback to directly using script id in case of legacy survey
        this.scriptSourceId = this.control.options.source;
      }
      this.scriptParams = this.getScriptParams();
    },
  },
  watch: {
    'control.name': {
      handler(newVal) {
        const key = convertToKey(newVal);
        this.control.name = key;
      },
    },
    'control.id': {
      handler(newVal, oldVal) {
        if (this.isScript && newVal !== oldVal) {
          this.updateScript();
        }
      },
    },
  },
  created() {
    this.updateScript();
  },
};
</script>

<style scoped>
.property-panel form {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.property-panel form > * + *,
.property-panel form > .extra-options > * + * {
  margin-top: 16px;
}

.property-panel form > .ml-2 + .ml-2 {
  margin-top: 12px;
}

.property-panel form > .spacer {
  height: 4px;
}

.property-panel form > .extra-options > div {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.property-panel form > .extra-options .v-input--selection-controls {
  margin-top: 0;
}

.property-panel .v-input--selection-controls {
  padding-top: 0;
}

.layout-select .v-list-item > div.col {
  width: 100%;
  white-space: nowrap;
}

.layout-select .v-list-item > div.col > .col-label {
  width: 80px;
}

.layout-select .v-list-item > div.col > .col-item {
  flex-grow: 1;
  padding: 8px;
  display: grid;
  gap: 8px;
}

.layout-select .v-list-item > div.col > .col-item > * {
  border: 2px solid #bdbdbd;
  text-align: center;
  padding: 2px;
}

.layout-select .v-list-item > div.col > .col-item.cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.layout-select .v-list-item > div.col > .col-item.cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.layout-select .v-list-item > div.col > .col-item.cols-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.layout-select .v-list-item > div.col > .col-item.cols-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.layout-select .v-list-item > div.col > .col-item.cols-5 {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}
</style>
