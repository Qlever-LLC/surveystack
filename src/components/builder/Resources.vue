<template>
  <div>
    <v-dialog v-model="editorDialog">
      <app-ontology-list-editor
        :resources="value.resources"
        :resource="selectedResource"
        @change="setResource"
        @delete="removeResource"
        @close-dialog="editorDialog = false"
      />
    </v-dialog>
    <v-select
      :items="availableFilters"
      v-model="filter"
      label="Filter"
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
          @click="selectedResource = resource; editorDialog = true"
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
import appOntologyListEditor from '@/components/builder/OntologyListEditor.vue';


export default {
  components: {
    appOntologyListEditor,
  },
  props: {
    value: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      search: '',
      filter: false,
      availableFilters: [{ text: 'All', value: false }, { text: 'Ontology List', value: 'ONTOLOGY_LIST' }, { text: 'Matrix', value: 'MATRIX' }],
      editorDialog: false,
      selectedResource: null,
    };
  },
  computed: {
    filteredResourcesByType() {
      if (!this.filter) {
        return this.value.resources;
      }
      return this.value.resources.filter(resource => resource.type === this.filter);
    },
    filteredResources() {
      if (!this.search) {
        return this.filteredResourcesByType;
      }
      return this.filteredResourcesByType.filter(resource => resource.label.toLowerCase().includes(this.search.toLowerCase()));
    },
  },
};
</script>
