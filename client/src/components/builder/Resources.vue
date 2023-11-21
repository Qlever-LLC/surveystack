<template>
  <div>
    <v-dialog v-model="ontologyEditorDialog">
      <app-ontology-list-editor
        :resources="resources"
        :resource="resource"
        :disabled="resource != null && resource.libraryId != null"
        @change="setResource"
        @delete="removeResource"
        @close-dialog="ontologyEditorDialog = false"
      />
    </v-dialog>
    <v-dialog :value="uploadingResource" hide-overlay persistent width="300">
      <v-card>
        <v-card-text class="pa-4">
          <span>Uploading file resource</span>
          <v-progress-linear indeterminate class="mb-0" />
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog :value="downloadingResource" hide-overlay persistent width="300">
      <v-card>
        <v-card-text class="pa-4">
          <span>Downloading file resource</span>
          <v-progress-linear indeterminate class="mb-0" />
        </v-card-text>
      </v-card>
    </v-dialog>
    <a-alert v-if="openResourceError" type="warning" closable>
      {{ openResourceError }}
    </a-alert>
    <div class="d-flex justify-end">
      <a-menu offset-y left>
        <template v-slot:activator="{ on }">
          <v-btn color="primary" v-on="on">
            <v-icon left>mdi-plus</v-icon>
            Add resource
          </v-btn>
        </template>
        <v-list>
          <v-list-item class="d-flex align-center">
            <v-list-item-title>
              <v-btn text @click="createOntology">
                <v-icon color="grey">mdi-plus</v-icon>
                <div class="ml-1">Create Ontology</div>
              </v-btn>
            </v-list-item-title>
          </v-list-item>
          <v-list-item v-if="$store.getters['toggle/isOn']['feature_resource']" class="d-flex align-center">
            <v-list-item-title>
              <a-input hide-details>
                <label for="upload-resource" class="cursor-pointer">
                  <v-btn class="pointer-events-none" text>
                    <v-icon color="grey">mdi-upload</v-icon>
                    <div class="ml-1">Add File Resource</div>
                  </v-btn>
                </label>
                <input
                  type="file"
                  id="upload-resource"
                  ref="upload-resource"
                  class="d-none"
                  @change="createFileResource"
                />
              </a-input>
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </a-menu>
    </div>
    <a-select :items="availableFilters" v-model="filter" label="Filter" />
    <a-text-field v-model="search" label="Search" autocomplete="off" />
    <v-list>
      <template v-if="filteredResources.length > 0">
        <v-list-item
          v-for="resource in filteredResources"
          :key="resource.id"
          two-line
          @click="openResource(resource)"
          :inactive="resource.type !== resourceTypes.FILE && resource.type !== resourceTypes.ONTOLOGY_LIST"
        >
          <v-list-item-content style="user-select: text">
            <v-list-item-title>{{ resource.label }}</v-list-item-title>
            <v-list-item-subtitle v-if="resource.type === resourceTypes.FILE">
              {{ `resources/${resource.id}/${resource.label} : ${resource.type}` }}
            </v-list-item-subtitle>
            <v-list-item-subtitle v-else> {{ resource.name }}</v-list-item-subtitle>
          </v-list-item-content>
          <v-icon v-if="resource.libraryId" color="grey lighten-1">mdi-library</v-icon>
          <v-list-item-action v-if="resource.type === resourceTypes.FILE">
            <v-btn icon>
              <v-icon color="grey lighten-1" @click.stop="removeRemoteResource(resource)"> mdi-delete </v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </template>
      <v-list-item v-else>
        <v-list-item-content>
          <v-list-item-title class="text--secondary">No resources found</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </div>
</template>

<script>
import ObjectId from 'bson-objectid';
import appOntologyListEditor from '@/components/builder/OntologyListEditor.vue';

import { openResourceInTab, resourceLocations, resourceTypes } from '@/utils/resources';
import store from '@/store';

export default {
  components: {
    appOntologyListEditor,
  },
  props: {
    resources: {
      type: Array,
    },
  },
  data() {
    return {
      resourceLocations,
      resourceTypes,
      search: '',
      filter: false,
      availableFilters: [
        { text: 'All', value: false },
        { text: 'Ontology List', value: resourceTypes.ONTOLOGY_LIST },
        { text: 'Image URL', value: resourceTypes.IMAGE },
        { text: 'File', value: resourceTypes.FILE },
        { text: 'Survey reference', value: resourceTypes.SURVEY_REFERENCE },
        { text: 'Script reference', value: resourceTypes.SCRIPT_REFERENCE },
      ],
      ontologyEditorDialog: false,
      selectedId: null,
      uploadingResource: false,
      downloadingResource: false,
      openResourceError: false,
    };
  },
  methods: {
    removeResource(id) {
      const index = this.resources.findIndex((r) => r.id === id);
      const newResources = [...this.resources.slice(0, index), ...this.resources.slice(index + 1)];
      this.$emit('set-survey-resources', newResources);
    },
    setResource(resource) {
      const index = this.resources.findIndex((r) => r.id === resource.id);
      const newResources = [...this.resources.slice(0, index), resource, ...this.resources.slice(index + 1)];
      this.$emit('set-survey-resources', newResources);
    },
    async createFileResource({
      target: {
        files: [file],
      },
    }) {
      this.uploadingResource = true;
      let resourceId = await this.$store.dispatch('resources/addRemoteResource', file);
      let newResource = store.getters['resources/getResource'](resourceId);

      // add survey resource
      this.$emit('set-survey-resources', [
        ...this.resources,
        {
          label: newResource.label,
          name: newResource.name,
          id: newResource._id,
          type: resourceTypes.FILE,
          location: resourceLocations.REMOTE,
        },
      ]);
      this.$refs['upload-resource'].value = null;
      this.uploadingResource = false;
    },
    async openResource(resource) {
      if (resource.type === resourceTypes.ONTOLOGY_LIST) {
        this.openOntologyEditor(resource.id);
      } else if (resource.type === resourceTypes.FILE) {
        await this.openFileResource(resource.id);
      } else {
        //  resourceTypes IMAGE and SURVEY_REFERENCE can not be opened here
      }
    },
    async removeRemoteResource(resource) {
      const resourceKey = `resources/${resource.id}/${resource.label}`;
      await this.$store.dispatch('resources/removeRemoteResource', resourceKey);
      const newResources = this.resources.filter((r) => r.id !== resource.id);
      this.$emit('set-survey-resources', newResources);
    },
    createOntology() {
      const id = new ObjectId().toString();
      this.$emit('set-survey-resources', [
        ...this.resources,
        {
          label: `Ontology List ${this.resources.length + 1}`,
          name: `ontology_list_${this.resources.length + 1}`,
          id,
          type: resourceTypes.ONTOLOGY_LIST,
          location: resourceLocations.EMBEDDED,
          content: [],
        },
      ]);
      this.openOntologyEditor(id);
    },
    openOntologyEditor(id) {
      this.selectedId = id;
      this.ontologyEditorDialog = true;
    },
    async openFileResource(id) {
      this.downloadingResource = true;
      try {
        await openResourceInTab(this.$store, id);
      } catch (error) {
        this.openResourceError = 'File could not be opened';
      } finally {
        this.downloadingResource = false;
      }
    },
  },
  computed: {
    filteredResourcesByType() {
      if (!this.filter) {
        return this.resources;
      }
      return this.resources.filter((resource) => resource.type === this.filter);
    },
    filteredResources() {
      if (!this.search) {
        return this.filteredResourcesByType;
      }
      return this.filteredResourcesByType.filter((resource) =>
        resource.label.toLowerCase().includes(this.search.toLowerCase())
      );
    },
    resource() {
      return this.resources.find((resource) => resource.id === this.selectedId);
    },
  },
};
</script>

<style scoped>
.pointer-events-none {
  pointer-events: none !important;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
