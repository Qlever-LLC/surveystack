<template>
  <div>
    <v-dialog v-model="editorDialog">
      <app-ontology-list-editor
        :resources="resources"
        :resource="resource"
        @change="setResource"
        @delete="removeResource"
        @close-dialog="editorDialog = false"
      />
    </v-dialog>
    <div class="d-flex justify-end">
      <v-btn
        class="primary"
        @click="createOntology"
      >
        <v-icon left>mdi-plus</v-icon> Create Ontology
      </v-btn>
    </div>
    <v-select
      :items="availableFilters"
      v-model="filter"
      label="Filter"
      disabled
    />
    <v-text-field
      v-model="search"
      label="Search"
      autocomplete="off"
    />
    <v-list>
      <template v-if="filteredResources.length > 0">
        <v-list-item
          v-for="resource in filteredResources"
          :key="resource.id"
          two-line
          @click="openEditor(resource.id)"
        >
          <v-list-item-content>
            <v-list-item-title>{{resource.label}}</v-list-item-title>
            <v-list-item-subtitle>{{resource.name}} : {{resource.type}}</v-list-item-subtitle>
          </v-list-item-content>

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
      filter: 'ONTOLOGY_LIST',
      availableFilters: [{ text: 'All', value: false }, { text: 'Ontology List', value: 'ONTOLOGY_LIST' }, { text: 'Matrix', value: 'MATRIX' }],
      editorDialog: false,
      selectedId: null,
    };
  },
  methods: {
    removeResource(id) {
      const index = this.resources.findIndex(r => r.id === id);
      const newResources = [
        ...this.resources.slice(0, index),
        ...this.resources.slice(index + 1),
      ];
      this.$emit('set-survey-resources', newResources);
    },
    setResource(resource) {
      const index = this.resources.findIndex(r => r.id === resource.id);
      const newResources = [
        ...this.resources.slice(0, index),
        resource,
        ...this.resources.slice(index + 1),
      ];
      this.$emit('set-survey-resources', newResources);
    },
    createOntology() {
      const id = new ObjectId().toString();
      this.$emit('set-survey-resources', [...this.resources, {
        label: `Ontology List ${this.resources.length + 1}`,
        name: `ontology_list_${this.resources.length + 1}`,
        id,
        type: 'ONTOLOGY_LIST',
        location: 'EMBEDDED',
        content: [],
      }]);
      this.openEditor(id);
    },
    openEditor(id) {
      this.selectedId = id;
      this.editorDialog = true;
    },
  },
  computed: {
    filteredResourcesByType() {
      if (!this.filter) {
        return this.resources;
      }
      return this.resources.filter(resource => resource.type === this.filter);
    },
    filteredResources() {
      if (!this.search) {
        return this.filteredResourcesByType;
      }
      return this.filteredResourcesByType.filter(resource => resource.label.toLowerCase().includes(this.search.toLowerCase()));
    },
    resource() {
      return this.resources.find(resource => resource.id === this.selectedId);
    },
  },
};
</script>
