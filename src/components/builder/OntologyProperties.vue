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
        :newResourceTypes="['ONTOLOGY_LIST', 'SURVEY_REFERENCE']"
      />
      <v-btn
        icon
        :disabled="disabled"
        @click.stop="openTableDialog"
        :class="{'d-none': !value}"
      >
        <!-- Edit entries -->
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
import { createResource } from '@/utils/resources';

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
    // createResource(type, id = new ObjectId().toString) {
    //   console.log(type);
    //   const resourceLabel = type === 'ONTOLOGY_LIST'
    //     ? 'Dropdown Items'
    //     : 'Survey Reference';

    //   return {
    //     label: `${resourceLabel} ${this.resources.length + 1}`,
    //     name: `${resourceLabel.toLowerCase().replace(' ', '_')}_${this.resources.length + 1}`,
    //     id,
    //     type,
    //     location: 'EMBEDDED',
    //     content: [],
    //   };
    // },
    createResourceHandler(type) {
      console.log('createResourceHandler', type);
      // const id = new ObjectId().toString();

      let newResource;
      if (type === 'ONTOLOGY_LIST') {
        newResource = createResource(this.resources, type, 'EMBEDDED', {
          labelPrefix: 'Dropdown Items',
          defaultContent: [],
        });
      } else if (type === 'SURVEY_REFERENCE') {
        newResource = createResource(this.resources, type, 'EMBEDDED', {
          labelPrefix: 'Survey Reference',
          defaultContent: [],
        });
      }
      console.log(newResource);
      this.$emit(
        'set-survey-resources',
        [
          ...this.resources,
          newResource,
          // {
          //   label: `Dropdown Items ${this.resources.length + 1}`,
          //   name: `dropdown_items_${this.resources.length + 1}`,
          //   id,
          //   type,
          //   location: 'EMBEDDED',
          //   content: [],
          // },
        ],
      );
      this.$emit('set-control-source', newResource.id);
      // this.$nextTick(() => {
      //   // Prevent opening the table dialog if somehow the ResourceSelector didn't
      //   // set a resource id
      //   if (this.value) {
      this.openTableDialog();
      // }
      // });
      // if (this.value) {
      // this.openTableDialog();
      // }
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
      default: () => ([]),
    },
    disabled: {
      required: false,
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
