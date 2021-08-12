<template>
  <div>
    <v-card-title class="px-0 d-flex justify-space-between">
      <div>
        Dropdown List
      </div>
    </v-card-title>
    <div class="text-center d-flex">
      <resource-selector
        :resources="filteredResources"
        :value="value"
        :disabled="disabled"
        @on-new="createResourceHandler"
        @on-select="selectResourceHandler"
        :newResourceTypes="[resourceTypes.ONTOLOGY_LIST, resourceTypes.SURVEY_REFERENCE]"
      />
      <v-btn icon :disabled="disabled" @click.stop="editResourceHandler" :class="{ 'd-none': !value }">
        <!-- Edit entries -->
        <v-icon class="ml-2 mt-3">mdi-pencil</v-icon>
      </v-btn>
    </div>
    <v-dialog v-model="tableDialogIsVisible">
      <ontology-list-editor
        v-if="tableDialogIsVisible && resource && resource.type === resourceTypes.ONTOLOGY_LIST"
        :resources="resources"
        :resource="resource"
        :disabled="disabled"
        @change="setResource"
        @delete="removeResource"
        @close-dialog="closeTableDialog"
      />
    </v-dialog>
    <v-dialog v-model="referenceDialogIsVisible" max-width="50%">
      <ontology-reference-editor
        v-if="referenceDialogIsVisible && resource && resource.type === resourceTypes.SURVEY_REFERENCE"
        :resources="resources"
        :resource="resource"
        @change="setResource"
        @delete="removeResource"
        @close-dialog="closeReferenceDialog"
      />
    </v-dialog>
  </div>
</template>

<script>
import ResourceSelector from '@/components/builder/ResourceSelector.vue';
import OntologyListEditor from '@/components/builder/OntologyListEditor.vue';
import OntologyReferenceEditor from '@/components/builder/OntologyReferenceEditor.vue';
import { createResource, resourceTypes, resourceLocations, setResource, removeResource } from '@/utils/resources';

export default {
  components: {
    OntologyListEditor,
    OntologyReferenceEditor,
    ResourceSelector,
  },
  data() {
    return {
      tableDialogIsVisible: false,
      referenceDialogIsVisible: false,
      resourceTypes,
      isEditing: false,
    };
  },
  methods: {
    editResourceHandler() {
      if (this.resource && this.resource.type === resourceTypes.ONTOLOGY_LIST) {
        this.openTableDialog();
      } else if (this.resource && this.resource.type === resourceTypes.SURVEY_REFERENCE) {
        this.openReferenceDialog();
      }
    },
    removeResource(id) {
      this.$emit('set-survey-resources', removeResource(this.resources, id));
      this.$emit('set-control-source', null);
    },
    setResource(resource) {
      this.$emit('set-survey-resources', setResource(this.resources, resource));
    },
    openTableDialog() {
      this.tableDialogIsVisible = true;
    },
    closeTableDialog() {
      this.tableDialogIsVisible = false;
    },
    openReferenceDialog() {
      this.referenceDialogIsVisible = true;
    },
    closeReferenceDialog() {
      this.referenceDialogIsVisible = false;
    },
    createResourceHandler(type) {
      let newResource;
      if (type === resourceTypes.ONTOLOGY_LIST) {
        newResource = createResource(this.resources, type, resourceLocations.EMBEDDED, {
          labelPrefix: 'Dropdown Items',
          defaultContent: [],
        });
      } else if (type === resourceTypes.SURVEY_REFERENCE) {
        newResource = createResource(this.resources, type, resourceLocations.REMOTE, {
          labelPrefix: 'Survey Reference',
          defaultContent: [],
        });
      }
      this.$emit('set-survey-resources', [...this.resources, newResource]);
      this.$emit('set-control-source', newResource.id);
      if (type === resourceTypes.ONTOLOGY_LIST) {
        this.openTableDialog();
      } else if (type === resourceTypes.SURVEY_REFERENCE) {
        this.openReferenceDialog();
      }
    },
    selectResourceHandler(id) {
      this.$emit('set-control-source', id);
    },
  },
  props: {
    value: {
      type: String,
    },
    resources: {
      type: Array,
      default: () => [],
    },
    disabled: {
      required: false,
    },
  },
  computed: {
    resource() {
      return this.resources.find((resource) => resource.id === this.value);
    },
    filteredResources() {
      return (
        this.resources &&
        this.resources.filter(
          (resource) =>
            resource.type === resourceTypes.ONTOLOGY_LIST || resource.type === resourceTypes.SURVEY_REFERENCE
        )
      );
    },
  },
};
</script>
