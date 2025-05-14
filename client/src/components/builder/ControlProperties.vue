<template>
  <div class="property-panel">
    <a-card-title class="pl-0">Properties</a-card-title>
    <a-form v-if="currentControl">
      <!-- Default properties -->
      <a-text-field v-model="currentControl.label" label="Label" hide-details />
      <a-text-field
        v-model="currentControl.name"
        label="Value"
        :disabled="!!currentControl.libraryId && !currentControl.isLibraryRoot"
        :rules="[nameIsUnique, nameHasValidCharacters, nameHasValidLength]"
        @focusout="convertNameToKey()" />
      <a-text-field v-model="currentControl.hint" label="Hint" hide-details />
      <markdown-editor
        v-model="currentControl.moreInfo"
        :resources="survey.resources"
        label="More info"
        placeholder="Add more info here"
        class="mt-6"
        @set-survey-resources="(val) => $emit('set-survey-resources', val)">
        <template #title>More info (markdown supported)</template>
      </markdown-editor>

      <!-- Control properties -->
      <a-text-field
        v-if="isText"
        v-model="currentControl.defaultValue"
        @blur="handleDefaultValueTrim"
        label="Default value"
        hide-details />
      <a-text-field
        v-if="isNumber"
        type="number"
        v-model="currentControl.defaultValue"
        @blur="handleDefaultValueTrimNumber"
        label="Default value"
        hide-details="auto"
        :rules="[isValidNumber]"
        clearable
        @click:clear="setToNull" />
      <instructions-editor
        v-if="isInstructions"
        v-model="currentControl.options.source"
        class="mt-6"
        :disabled="
          !!currentControl.libraryId && !currentControl.options.allowModify && !currentControl.isLibraryRoot
        " />
      <instructions-image-split-editor
        v-if="isInstructionsImageSplit"
        v-model="currentControl.options.source"
        :resources="survey.resources"
        :disabled="!!currentControl.libraryId && !currentControl.options.allowModify && !currentControl.isLibraryRoot"
        @set-survey-resources="(val) => $emit('set-survey-resources', val)"
        @set-control-source="(val) => $emit('set-control-source', val)" />
      <a-select
        v-if="isDate"
        :items="dateTypes"
        item-title="text"
        item-value="value"
        label="Type"
        v-model="currentControl.options.subtype"
        @update:modelValue="() => (currentControl.defaultValue = null)"
        :disabled="!!currentControl.libraryId && !currentControl.options.allowModify && !currentControl.isLibraryRoot"
        hide-details />
      <select-items-editor
        v-if="isSelect"
        v-model="currentControl.options.source"
        @update:modelValue="currentControl.defaultValue = null"
        :disabled="!!currentControl.libraryId && !currentControl.options.allowModify && !currentControl.isLibraryRoot"
        class="mt-3" />
      <ontology-properties
        v-if="isOntology"
        :value="currentControl.options.source"
        :resources="survey.resources"
        :disable-selection="
          !!currentControl.libraryId && !currentControl.options.allowModify && !currentControl.isLibraryRoot
        "
        @set-control-source="(val) => $emit('set-control-source', val)"
        @set-survey-resources="(val) => $emit('set-survey-resources', val)" />
      <a-text-field
        v-if="isMatrix"
        v-model="currentControl.options.source.config.addRowLabel"
        label="Add Row label"
        hide-details />
      <matrix-properties
        v-if="isMatrix"
        v-model="currentControl.options.source"
        :resources="survey.resources"
        :disabled="!!currentControl.libraryId && !currentControl.options.allowModify && !currentControl.isLibraryRoot"
        :allowSetAllowHide="!!survey.meta.isLibrary"
        @set-control-source="(val) => $emit('set-control-source', val)"
        @set-survey-resources="(val) => $emit('set-survey-resources', val)"
        @set-control-required="currentControl.options.required = true"
        class="mt-3" />
      <a-select
        v-if="currentControl.type === 'file'"
        label="Restrict uploaded file types (.csv, .pdf, etc.)"
        v-model="currentControl.options.source.types"
        :items="fileTypes"
        item-title="text"
        item-value="value"
        :disabled="!!currentControl.libraryId && !currentControl.options.allowModify && !currentControl.isLibraryRoot"
        multiple
        chips
        clearable
        closable-chips
        hide-details />
      <a-select
        v-if="isScript"
        v-model="scriptSourceId"
        @update:modelValue="handleScriptSourceChange"
        @click:append="() => $emit('set-script-editor-is-visible', true)"
        @focus="handleScriptSourceFocus"
        append-icon="mdi-open-in-new"
        :disabled="!!currentControl.libraryId && !currentControl.options.allowModify && !currentControl.isLibraryRoot"
        hide-details
        :items="scriptSourceItems"
        item-title="name"
        item-value="_id"
        label="Script Source"
        selectionSlot>
        <template v-slot:selection="{ item }">
          <div>{{ item.title }}</div>
        </template>
      </a-select>
      <a-text-field
        v-if="isScript"
        v-model="currentControl.options.buttonLabel"
        label="Run Button Label"
        hide-details />
      <!-- TODO: allow params to be written JS style, instead of strict JSON, fix updating -->
      <a-textarea
        v-if="isScript"
        v-model="scriptParams"
        @update:modelValue="handleScriptParamsChange"
        label="Parameters"
        :rules="[validateScriptParams]"
        :disabled="!!currentControl.libraryId && !currentControl.options.allowModify && !currentControl.isLibraryRoot"
        class="pt-3"
        hide-details />
      <a-select
        allowCustomItem
        v-if="isFarmOsUuid"
        label="FarmOS Type"
        v-model="currentControl.options.farmOsType"
        @update:modelValue="handleFarmOsTypeChange"
        :items="currentControl.options.farmOsTypes"
        :disabled="
          !!currentControl.libraryId && !currentControl.options.allowModify && !currentControl.isLibraryRoot
        " />
      <ontology
        v-if="isOntology && !!currentControl.options.hasMultipleSelections"
        v-model="currentControl.defaultValue"
        :multiple="currentControl.options.hasMultipleSelections"
        :customAnswer="currentControl.options.allowCustomSelection"
        :source="currentControl.options.source"
        :resources="survey.resources" />
      <ontology
        v-if="isOntology && !currentControl.options.hasMultipleSelections"
        v-model="currentControl.defaultValue"
        :multiple="currentControl.options.hasMultipleSelections"
        :customAnswer="currentControl.options.allowCustomSelection"
        :source="currentControl.options.source"
        :resources="survey.resources" />
      <date
        v-if="isDate && currentControl.options.subtype"
        v-model="currentControl.defaultValue"
        @update:modelValue="$forceUpdate()"
        @blur="handleDefaultValueTrim"
        :type="currentControl.options.subtype"
        class="mt-3" />
      <div v-if="isDate && currentControl.options.subtype" class="d-flex justify-space-betweeen mt-3">
        <date
          label="Start Year"
          v-model="currentControl.startYear"
          @update:modelValue="$forceUpdate()"
          type="date-year"
          class="mt-0"
          :class="{ 'mr-4': currentControl.options.subtype !== 'date-year' }" />
        <a-select
          v-if="currentControl.options.subtype !== 'date-year'"
          label="Start Month"
          v-model="currentControl.startMonth"
          :items="monthsList"
          item-title="title"
          item-value="value"
          clearable
          hide-details
          class="mt-0 ml-4" />
      </div>
      <select-items
        v-if="isSelect && currentControl.options.source"
        v-model="currentControl.defaultValue"
        @blur="handleDefaultValueTrim"
        :items="currentControl.options.source"
        :custom="currentControl.options.allowCustomSelection"
        :multiple="currentControl.type === 'selectMultiple'"
        class="mt-3" />

      <!-- Control options -->
      <a-spacer />
      <a-checkbox
        v-if="isText"
        label="Long Text"
        v-model="currentControl.options.longText"
        :disabled="!!currentControl.libraryId && !currentControl.options.allowModify && !currentControl.isLibraryRoot"
        helper-text="Allow answers to flow to the next line for longer answers or paragraphs"
        color="grey-darken-1"
        class="align-center align-self-start" />
      <a-checkbox
        v-if="isOntology"
        class="align-center align-self-start"
        color="grey-darken-1"
        hide-details="auto"
        label="Multiple select"
        v-model="currentControl.options.hasMultipleSelections"
        :disabled="
          !!currentControl.libraryId && !currentControl.options.allowModify && !currentControl.isLibraryRoot
        " />
      <a-checkbox
        v-if="isSelect || isOntology"
        class="align-center align-self-start"
        color="grey-darken-1"
        hide-details="auto"
        label="Allow custom answer"
        v-model="currentControl.options.allowCustomSelection"
        @update:modelValue="currentControl.defaultValue = null"
        :disabled="!!currentControl.libraryId && !currentControl.options.allowModify && !currentControl.isLibraryRoot">
        <template v-slot:helper-text>
          Allows the user to input answers that do not exist within the provided items.
          <span v-if="isOntology">This will also require <strong>Autocomplete</strong> is on</span>
        </template>
      </a-checkbox>
      <a-checkbox
        v-if="hasRequiredOption"
        label="Required"
        v-model="currentControl.options.required"
        :disabled="!!currentControl.libraryId && !currentControl.options.allowModify && !currentControl.isLibraryRoot"
        helper-text="Make this a required field"
        color="grey-darken-1"
        class="align-center align-self-start" />
      <a-checkbox
        label="Private"
        v-model="currentControl.options.redacted"
        :disabled="!!currentControl.libraryId && !currentControl.options.allowModify && !currentControl.isLibraryRoot"
        helper-text="Only admins and original submitters can see this field"
        color="grey-darken-1"
        class="align-center align-self-start" />
      <a-checkbox
        v-if="isPage"
        label="Compact"
        v-model="currentControl.options.compact"
        helper-text="Reduce the spaces and combine fields into one card"
        color="grey-darken-1"
        class="align-center align-self-start" />
      <a-checkbox
        v-if="isText"
        label="QR Code"
        v-model="currentControl.options.enableQr"
        :disabled="!!currentControl.libraryId && !currentControl.isLibraryRoot"
        color="grey-darken-1"
        class="align-center align-self-start" />
      <a-checkbox
        v-if="survey.meta.isLibrary && !currentControl.libraryIsInherited && !currentControl.libraryId"
        label="Allow modify"
        v-model="currentControl.options.allowModify"
        helper-text="Allow users of this question set to modify this question"
        color="grey-darken-1"
        class="align-center align-self-start" />
      <a-checkbox
        v-if="survey.meta.isLibrary && !currentControl.libraryIsInherited && !currentControl.libraryId"
        label="Allow hide"
        v-model="currentControl.options.allowHide"
        helper-text="Allow users of this question set to hide this question"
        color="grey-darken-1"
        class="align-center align-self-start" />
      <a-checkbox
        v-if="currentControl.libraryId && currentControl.options.allowHide"
        label="Hidden"
        v-model="currentControl.options.hidden"
        helper-text="Submitters can not see this field. This option is intentionally allowed by the question set designer"
        color="grey-darken-1"
        class="align-center align-self-start" />
      <a-checkbox
        v-if="
          currentControl.type === 'farmOsPlanting' ||
          currentControl.type === 'farmOsFarm' ||
          currentControl.type === 'farmOsField'
        "
        label="Multiple select"
        v-model="currentControl.options.hasMultipleSelections"
        :disabled="!!currentControl.libraryId && !currentControl.options.allowModify && !currentControl.isLibraryRoot"
        color="grey-darken-1"
        class="align-center align-self-start" />
      <a-checkbox
        v-if="isFile"
        label="Multiple upload"
        v-model="currentControl.options.source.allowMultiple"
        helper-text="Allow user to upload multiple files"
        color="grey-darken-1"
        class="align-center align-self-start" />
      <a-checkbox
        v-if="currentControl.type === 'script'"
        label="Native Script"
        v-model="currentControl.options.isNativeScript"
        :disabled="!!currentControl.libraryId && !currentControl.isLibraryRoot"
        helper-text="Show Download Link for Surveystack Kit APK"
        color="grey-darken-1"
        class="align-center align-self-start" />
      <template v-if="isGeoJSON">
        <a-checkbox
          v-for="opt in geoJsonOptions"
          :key="opt.key"
          :label="opt.text"
          v-model="currentControl.options.geoJSON[opt.key]"
          color="grey-darken-1"
          class="align-center align-self-start" />
      </template>

      <!-- Advanced properties -->
      <a-btn
        v-if="!showAdvanced && !hasExpressionEnabled"
        color="grey-darken-1"
        class="align-self-end"
        @click="showAdvanced = true"
        small
        variant="text">
        advanced
      </a-btn>
      <div v-else class="extra-options">
        <a-spacer />
        <div>
          <a-card-title class="px-0 py-0">Advanced Options</a-card-title>
          <a-icon v-if="!hasExpressionEnabled" @click.stop="showAdvanced = false">mdi-close</a-icon>
        </div>

        <div>
          <a-checkbox
            label="Relevance Expression"
            v-model="relevance.enabled"
            :disabled="
              !!currentControl.libraryId && !currentControl.options.allowModify && !currentControl.isLibraryRoot
            "
            color="grey-darken-1"
            class="align-center align-self-start" />
          <a-icon color="grey-darken-1" @click="$emit('code-relevance')" size="20"> mdi-open-in-new </a-icon>
        </div>

        <div v-if="isText || isNumber || isDate || isMatrix || isOntology || isSelect">
          <a-checkbox
            label="Initialize Expression"
            v-model="initialize.enabled"
            :disabled="
              !!currentControl.libraryId && !currentControl.options.allowModify && !currentControl.isLibraryRoot
            "
            color="grey-darken-1"
            class="align-center align-self-start" />
          <a-icon color="grey-darken-1" @click="$emit('code-initialize')" size="20"> mdi-open-in-new </a-icon>
        </div>

        <!-- TODO not implemented yet - decide to implement or remove-->
        <!--div>
          <a-checkbox
            label="Calculate Expression"
            v-model="calculate.enabled"
            :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
            color="grey-darken-1"
            class="align-center align-self-start"
          />
          <a-icon class="align-self-start" color="grey-darken-1" @click="$emit('code-calculate')" size="20">
            mdi-open-in-new
          </a-icon>
        </div>

        <div>
          </v-icon>
        </div-->
        <!--div>
          <a-checkbox
            label="Constraint Expression"
            v-model="constraint.enabled"
            :disabled="!!control.libraryId && !control.options.allowModify && !control.isLibraryRoot"
            color="grey-darken-1"
            class="align-center align-self-start"
          />
          <a-icon class="align-self-start" color="grey-darken-1" @click="$emit('code-constraint')" size="20">
            mdi-open-in-new
          </a-icon>
        </div-->

        <div>
          <a-checkbox
            label="Api Compose Expression"
            v-model="apiCompose.enabled"
            :disabled="
              !!currentControl.libraryId && !currentControl.options.allowModify && !currentControl.isLibraryRoot
            "
            color="grey-darken-1"
            class="align-center align-self-start" />
          <a-icon color="grey-darken-1" @click="$emit('code-api-compose')" size="20"> mdi-open-in-new </a-icon>
        </div>
      </div>

      <!-- Print layout -->
      <template v-if="hasLayoutOptions">
        <a-btn
          v-if="!showLayout"
          color="grey-darken-1"
          class="align-self-end"
          @click="showLayout = true"
          small
          variant="text">
          Print Layout
        </a-btn>
        <div v-else class="extra-options">
          <a-spacer />
          <div>
            <a-card-title class="px-0 py-0">Print Layout</a-card-title>
            <a-icon @click.stop="showLayout = false">mdi-close</a-icon>
          </div>

          <div v-if="isMatrix">
            <a-checkbox
              label="Table format"
              v-model="currentControl.options.printLayout.table"
              helper-text="Renders the matrix answers in tabular format. Otherwise, it is rendered in list format."
              color="grey-darken-1"
              class="align-center align-self-start" />
          </div>

          <div v-if="isFile">
            <a-checkbox
              label="Show preview"
              v-model="currentControl.options.printLayout.preview"
              helper-text="Render the uploaded images. JPEG and PNG formats are supported. By default, only links are rendered."
              color="grey-darken-1"
              class="align-center align-self-start" />
          </div>

          <template v-if="isSelect || isOntology">
            <div>Blank Survey (from title page)</div>
            <div class="mt-2">
              <a-checkbox
                label="Show all resource list options"
                v-model="currentControl.options.printLayout.showAllOptionsPrintable"
                helper-text="Show the complete list of possible options when printing a fresh survey"
                color="grey-darken-1"
                class="align-center align-self-start" />
            </div>

            <div>Filled Response</div>
            <div class="mt-2">
              <a-checkbox
                label="Show all resource list options"
                v-model="currentControl.options.printLayout.showAllOptions"
                helper-text="Show the complete list of possible options when printing a completed survey response, with the selected answer highlighted"
                color="grey-darken-1"
                class="align-center align-self-start" />
            </div>

            <a-select
              label="Answer layout"
              v-model="currentControl.options.printLayout.columns"
              :items="[1, 2, 3, 4, 5]"
              color="focus"
              :menu-props="{ contentClass: 'layout-select' }"
              hide-details
              selectionSlot
              itemSlot
              appendSlot>
              <template v-slot:selection="{ item }">
                {{ item.value === 1 ? '1 column' : `${item.value} columns` }}
              </template>

              <template v-slot:item="{ props, item }">
                <a-list-item>
                  <a-list-item-title v-bind="props">
                    <div class="d-flex align-center col">
                      <div class="col-label">
                        {{ item.value === 1 ? '1 column' : `${item.value} columns` }}
                      </div>
                      <div class="ml-2" :class="`col-item cols-${item.value}`">
                        <div v-for="letter in 'ABCDE'.split('')" :key="letter">
                          {{ letter }}
                        </div>
                      </div>
                    </div>
                  </a-list-item-title>
                </a-list-item>
              </template>

              <template #append>
                <a-icon size="20" tooltip="Set the number of items in a row">mdi-help-circle-outline</a-icon>
              </template>
            </a-select>
          </template>
        </div>
      </template>

      <a-spacer />
    </a-form>
  </div>
</template>
<script>
import { findParentByChildId, getAdvancedCodeTemplate } from '@/utils/surveys';
import { nameHasValidCharacters, nameHasValidLength } from '@/utils/resources';
import SelectItems from '@/components/builder/SelectItems.vue';
import SelectItemsEditor from '@/components/builder/SelectItemsEditor.vue';
import MatrixProperties from '@/components/builder/MatrixProperties.vue';
import OntologyProperties from '@/components/builder/OntologyProperties.vue';
import InstructionsEditor from '@/components/builder/TipTapEditor.vue';
import InstructionsImageSplitEditor from '@/components/builder/InstructionsImageSplitEditor.vue';
import Ontology from '@/components/builder/Ontology.vue';
import Date from '@/components/builder/Date.vue';
import MarkdownEditor from '@/components/builder/MarkdownEditor.vue';

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

    MarkdownEditor,
  },
  props: {
    control: {
      required: false,
    },
    initialize: {},
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
        // {
        //   text: 'Month and Year Only',
        //   value: 'date-month-year',
        // },
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
        {
          key: 'showGeoTrace',
          text: 'Show geotrace control',
        },
      ],
      monthsList: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ],
    };
  },
  computed: {
    currentControl() {
      return this.control;
    },
    controlNames() {
      return this.controls.map((control) => control.name);
    },
    isGroup() {
      return this.currentControl.type === 'group';
    },
    isFile() {
      return this.currentControl.type === 'file' || this.currentControl.type === 'image';
    },
    isDate() {
      return this.currentControl.type === 'date';
    },
    isText() {
      return this.currentControl.type === 'string';
    },
    isNumber() {
      return this.currentControl.type === 'number';
    },
    isScript() {
      return this.currentControl.type === 'script';
    },
    isInstructions() {
      return this.currentControl.type === 'instructions';
    },
    isSelect() {
      return /select/i.test(this.currentControl.type);
    },
    isOntology() {
      return this.currentControl.type === 'ontology';
    },
    isMatrix() {
      return this.currentControl.type === 'matrix';
    },
    isGeoJSON() {
      return this.currentControl.type === 'geoJSON';
    },
    isInstructionsImageSplit() {
      return this.currentControl.type === 'instructionsImageSplit';
    },
    isPage() {
      return this.currentControl.type === 'page';
    },
    isFarmOsUuid() {
      return this.currentControl.type === 'farmOsUuid';
    },
    hasRequiredOption() {
      return (
        this.currentControl.options.required ||
        !['group', 'page', 'instructions', 'instructionsImageSplit'].includes(this.currentControl.type)
      );
    },
    hasExpressionEnabled() {
      return (
        (this.initialize && this.initialize.enabled) ||
        (this.calculate && this.calculate.enabled) ||
        (this.relevance && this.relevance.enabled) ||
        (this.constraint && this.constraint.enabled) ||
        (this.apiCompose && this.apiCompose.enabled)
      );
    },
    hasLayoutOptions() {
      return this.isSelect || this.isOntology || this.isFile || this.isMatrix;
    },
  },
  methods: {
    nameIsUnique() {
      const hasSameNameAndDifferentId = (control) =>
        control.name === this.currentControl.name && control.id !== this.currentControl.id;
      const parent = findParentByChildId(this.currentControl.id, this.controls);

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
    convertNameToKey() {
      const key = convertToKey(this.currentControl.name);
      this.currentControl.name = key;
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
      const value = this.currentControl.defaultValue;
      this.currentControl.defaultValue = getValueOrNull(Array.isArray(value) ? value.map(getValueOrNull) : value);
    },
    handleFarmOsTypeChange(type) {
      this.currentControl.options.farmOsType = getValueOrNull(type);
    },
    validateScriptParams(params) {
      try {
        JSON.parse(params);
      } catch (err) {
        return 'Invalid JSON';
      }
      return true;
    },
    handleDefaultValueTrimNumber() {
      const val = this.control.defaultValue;
      if (val === '0') {
        //the number 0 is to be considered separately because Number(0) is also equal to false
        const value = String(Number(this.control.defaultValue));
        this.control.defaultValue = getValueOrNull(Array.isArray(value) ? value.map(getValueOrNull) : value);
      } else if (Number(val)) {
        const value = Number(this.control.defaultValue);
        this.control.defaultValue = getValueOrNull(Array.isArray(value) ? value.map(getValueOrNull) : value);
      } else {
        this.control.defaultValue = null;
      }
    },
    isValidNumber(val) {
      return isNaN(Number(val)) ? 'Please enter a number' : true;
    },
    setToNull(e) {
      e.target.value = null;
    },
    getScriptParams() {
      return (
        (this.currentControl && this.currentControl.options && JSON.stringify(this.currentControl.options.params)) ||
        JSON.stringify({})
      );
    },
    updateScript() {
      if (this.isScript) {
        this.fetchScripts();
      }
      const scriptResource = this.survey.resources.find((r) => r.id === this.currentControl.options.source);
      if (scriptResource) {
        this.scriptSourceId = scriptResource.content;
      } else {
        //fallback to directly using script id in case of legacy survey
        this.scriptSourceId = this.currentControl.options.source;
      }
      this.scriptParams = this.getScriptParams();
    },
  },
  watch: {
    'currentControl.name': {
      handler(newVal) {
        // Replace all spaces with underscores
        const withUnderscores = newVal.replace(/ /g, '_');
        // Replace multiple underscores with a single one
        const cleaned = withUnderscores.replace(/_+/g, '_');
        this.currentControl.name = cleaned;
      },
    },
    'currentControl.id': {
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

<style scoped lang="scss">
.property-panel form {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.property-panel form > * + *,
.property-panel form > .extra-options > * + * {
  margin-top: 16px;
}
.property-panel form > .v-checkbox {
  margin-top: 0;
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
  margin-top: 0;
}

.layout-select .v-list-item > div.col {
  width: 100%;
  white-space: nowrap;
}

.col-label {
  width: 80px;
}

.col-item {
  flex-grow: 1;
  padding: 8px;
  display: grid;
  gap: 8px;
}

.col-item > * {
  border: 2px solid #bdbdbd;
  text-align: center;
  padding: 2px;
}

.col-item.cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.col-item.cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.col-item.cols-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.col-item.cols-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.col-item.cols-5 {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}
</style>
