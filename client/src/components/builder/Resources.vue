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
    <div class="d-flex justify-end">
      <v-menu offset-y left>
        <template v-slot:activator="{ on }">
          <v-btn color="primary" v-on="on">
            <v-icon left>mdi-plus</v-icon>
            Add resource
          </v-btn>
        </template>
        <v-list>
          <v-list-item v-if="$store.getters['toggle/isOn']['feature_resource']" class="d-flex align-center">
            <v-list-item-title>
              <v-btn text @click="importResource">
                <v-icon color="grey">mdi-plus</v-icon>
                <div class="ml-1">Use Existing Resource</div>
              </v-btn>
            </v-list-item-title>
          </v-list-item>
          <v-list-item v-if="$store.getters['toggle/isOn']['feature_resource']" class="d-flex align-center">
            <v-list-item-title>
              <v-input hide-details>
                <label for="upload-resource" class="cursor-pointer">
                  <v-btn class="pointer-events-none" text>
                    <v-icon color="grey">mdi-upload</v-icon>
                    <div class="ml-1">Create File Resource</div>
                  </v-btn>
                </label>
                <input
                  type="file"
                  id="upload-resource"
                  ref="upload-resource"
                  class="d-none"
                  @change="createFileResource"
                />
              </v-input>
            </v-list-item-title>
          </v-list-item>
          <v-list-item class="d-flex align-center">
            <v-list-item-title>
              <v-btn text @click="createOntology">
                <v-icon color="grey">mdi-plus</v-icon>
                <div class="ml-1">Create Ontology</div>
              </v-btn>
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
    <!--v-select :items="availableFilters" v-model="filter" label="Filter" />
    <v-text-field v-model="search" label="Search" autocomplete="off" /-->
    <v-list>
      <template v-if="filteredResources.length > 0">
        <v-list-item v-for="resource in filteredResources" :key="resource.id" two-line @click="openResource(resource)">
          <v-list-item-content>
            <v-list-item-title>{{ resource.label }}</v-list-item-title>
            <v-list-item-subtitle>{{ resource.name }} : {{ resource.type }}</v-list-item-subtitle>
          </v-list-item-content>
          <v-icon v-if="resource.libraryId" color="grey lighten-1">mdi-library</v-icon>
          <v-list-item-action v-if="resource.location === 'REMOTE'">
            <v-btn icon>
              <v-icon color="grey lighten-1" @click.stop="removeRemoteResource(resource)">mdi-delete</v-icon>
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
import slugify from '@/utils/slugify';
import { openResourceInTab, resourceLocations } from '@/utils/resources';

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
      search: '',
      filter: false,
      availableFilters: [
        { text: 'All', value: false },
        { text: 'Ontology List', value: 'ONTOLOGY_LIST' },
        { text: 'Matrix', value: 'MATRIX' },
        { text: 'Remote', value: 'REMOTE' },
      ],
      ontologyEditorDialog: false,
      selectedId: null,
      uploadingResource: false,
      downloadingResource: false,
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
    async test() {
      console.log('test');
    },
    async createFileResource({
      target: {
        files: [file],
      },
    }) {
      this.uploadingResource = true;
      let resourceId = await this.$store.dispatch('resources/addRemoteResource', file);
      this.uploadingResource = false;
      //TODO get back the resource, not just id, and add that below instead of creating a new resource object
      // add survey resource
      this.$emit('set-survey-resources', [
        ...this.resources,
        {
          label: file.name,
          name: slugify(file.name),
          id: resourceId,
          type: file.type,
          location: resourceLocations.REMOTE,
        },
      ]);
      this.$refs['upload-resource'].value = null;
    },
    async openResource(resource) {
      if (resource.type === 'ONTOLOGY_LIST') {
        this.openOntologyEditor(resource.id);
      } else {
        this.downloadingResource = true;
        await openResourceInTab(resource.id);
        this.downloadingResource = false;
      }
    },

    importResource() {
      // TODO show dialog with resource list / search
    },
    removeRemoteResource(resource) {
      // delete the resource reference
      const index = this.resources.findIndex((r) => r.id === resource.id);
      const newResources = [...this.resources.slice(0, index), ...this.resources.slice(index + 1)];
      this.$emit('set-survey-resources', newResources);
      // TODO delete the resource eventually
    },
    createOntology() {
      const id = new ObjectId().toString();
      this.$emit('set-survey-resources', [
        ...this.resources,
        {
          label: `Ontology List ${this.resources.length + 1}`,
          name: `ontology_list_${this.resources.length + 1}`,
          id,
          type: 'ONTOLOGY_LIST',
          location: 'EMBEDDED',
          content: [],
        },
      ]);
      this.openOntologyEditor(id);
    },
    openOntologyEditor(id) {
      this.selectedId = id;
      this.ontologyEditorDialog = true;
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
