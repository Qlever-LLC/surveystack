<template>
  <div>
    <v-card-title class="px-0 d-flex justify-space-between">
      <div>
        Dropdown List
      </div>

    </v-card-title>
    <div class="text-center d-flex">
      <!-- :resourceTypes="['ONTOLOGY_LIST']" -->
      <resource-selector
        :resources="filteredResources"
        :value="value"
        @on-new="createResourceHandler"
        @on-select="selectResourceHandler"
      />
      <v-btn
        icon
        @click.stop="openTableDialog"
        :class="{'d-none': !value}"
      >
        <!-- Edit entries -->
        <!-- <v-icon class="ml-2">mdi-table</v-icon> -->
        <v-icon class="ml-2 mt-3">mdi-pencil</v-icon>
      </v-btn>

    </div>
    <v-dialog v-model="tableDialogIsVisible">

      <app-ontology-list-editor
        :resources="resources"
        :resource="resource"
        @change="setResource"
        @delete="removeResource"
        @close-dialog="closeTableDialog"
      />

    </v-dialog>
  </div>
</template>

<script>
import ObjectId from 'bson-objectid';
import ResourceSelector from '@/components/builder/ResourceSelector.vue';

import appOntologyListEditor from '@/components/builder/OntologyListEditor.vue';

export default {
  components: {
    appOntologyListEditor,
    ResourceSelector,
  },
  data() {
    return {
      tableDialogIsVisible: false,
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
      this.$emit('set-control-source', null);
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
    openTableDialog() {
      this.tableDialogIsVisible = true;
    },
    closeTableDialog() {
      this.tableDialogIsVisible = false;
    },
    createResourceHandler() {
      const id = new ObjectId().toString();
      this.$emit('set-survey-resources', [...this.resources, {
        label: `Dropdown Items ${this.resources.length + 1}`,
        // handle: `dropdown_items_${this.resources.length + 1}`,
        name: `dropdown_items_${this.resources.length + 1}`,
        id,
        type: 'ONTOLOGY_LIST',
        location: 'EMBEDDED',
        content: [],
      }]);
      this.$emit('set-control-source', id);
      this.openTableDialog();
    },
    selectResourceHandler(id) {
      this.$emit('set-control-source', id);
    },
  },
  // model: {
  //   // prop: 'items',
  //   event: 'set-control-source',
  //   // event: 'change',
  // },
  props: {
    // value: {
    //   type: Array,
    //   required: true,
    // },
    value: {
      type: String,
    },
    resources: {
      type: Array,
      default: () => ([]),
    },
  },
  computed: {
    resource() {
      return this.resources.find(resource => resource.id === this.value);
    },
    filteredResources() {
      return this.resources.filter(resource => resource.type === 'ONTOLOGY_LIST');
    },
  },
};
</script>
