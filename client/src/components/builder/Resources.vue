<template>
  <div>
    <a-dialog v-model="ontologyEditorDialog">
      <app-ontology-list-editor
        :resources="resources"
        :resource="resource"
        :disabled="resource != null && resource.libraryId != null"
        @change="setResource"
        @delete="removeResource"
        @close-dialog="ontologyEditorDialog = false" />
    </a-dialog>
    <a-dialog :modelValue="uploadingResource" persistent width="300">
      <a-card>
        <a-card-text class="pa-4">
          <span>Uploading file resource</span>
          <a-progress-linear class="mb-0" />
        </a-card-text>
      </a-card>
    </a-dialog>
    <a-dialog :modelValue="downloadingResource" persistent width="300">
      <a-card>
        <a-card-text class="pa-4">
          <span>Downloading file resource</span>
          <a-progress-linear class="mb-0" />
        </a-card-text>
      </a-card>
    </a-dialog>
    <a-alert v-if="openResourceError" type="warning" closable>
      {{ openResourceError }}
    </a-alert>
    <div class="d-flex justify-end">
      <a-menu location="bottom" v-model="menuIsOpen">
        <template v-slot:activator="{ props }">
          <a-btn color="primary" v-bind="props">
            <a-icon left>mdi-plus</a-icon>
            Add resource
          </a-btn>
        </template>
        <a-list>
          <a-list-item class="d-flex align-center">
            <a-list-item-title>
              <a-btn variant="text" @click="createOntology">
                <a-icon color="grey">mdi-plus</a-icon>
                <div class="ml-1">Create Ontology</div>
              </a-btn>
            </a-list-item-title>
          </a-list-item>
          <a-list-item class="d-flex align-center">
            <a-list-item-title>
              <a-input hide-details>
                <label for="upload-resource" class="cursor-pointer">
                  <a-btn class="pointer-events-none" variant="text">
                    <a-icon color="grey">mdi-upload</a-icon>
                    <div class="ml-1">Add File Resource</div>
                  </a-btn>
                </label>
                <input
                  type="file"
                  id="upload-resource"
                  ref="upload-resource"
                  class="d-none"
                  @change="createFileResource" />
              </a-input>
            </a-list-item-title>
          </a-list-item>
        </a-list>
      </a-menu>
    </div>
    <a-select :items="availableFilters" item-title="text" item-value="value" v-model="filter" label="Filter" />
    <a-text-field v-model="search" label="Search" autocomplete="off" />
    <a-list>
      <template v-if="filteredResources.length > 0">
        <a-list-item
          v-for="resource in filteredResources"
          :key="resource.id"
          two-line
          @click="openResource(resource)"
          :inactive="resource.type !== resourceTypes.FILE && resource.type !== resourceTypes.ONTOLOGY_LIST">
          <a-list-item-title style="user-select: text">{{ resource.label }}</a-list-item-title>
          <a-list-item-subtitle v-if="resource.type === resourceTypes.FILE" style="user-select: text">
            {{ `resources/${resource.id}/${resource.label} : ${resource.type}` }}
          </a-list-item-subtitle>
          <a-list-item-subtitle v-else style="user-select: text"> {{ resource.name }}</a-list-item-subtitle>
          <template v-slot:append>
            <a-icon v-if="resource.libraryId" color="grey-lighten-1">mdi-library</a-icon>
            <a-list-item-action v-if="resource.type === resourceTypes.FILE">
              <a-btn icon>
                <a-icon color="grey-lighten-1" @click.stop="removeRemoteResource(resource)"> mdi-delete </a-icon>
              </a-btn>
            </a-list-item-action>
          </template>
        </a-list-item>
      </template>
      <a-list-item v-else>
        <a-list-item-title class="text-secondary">No resources found</a-list-item-title>
      </a-list-item>
    </a-list>
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
      menuIsOpen: false,
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
      if (this.$refs['upload-resource']) {
        this.$refs['upload-resource'].value = null;
      }
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

<style scoped lang="scss">
.pointer-events-none {
  pointer-events: none !important;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
