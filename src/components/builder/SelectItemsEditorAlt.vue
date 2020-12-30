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
        newResourceType="ONTOLOGY_LIST"
        @on-new="createResourceHandler"
        @on-select="selectResourceHandler"
      />
      <v-btn
        icon
        @click.stop="openTableDialog"
        :class="{'d-none': !value}"
        class="ml-2 mt-3"
      >
        <!-- Edit entries -->
        <!-- <v-icon class="ml-2">mdi-table</v-icon> -->
        <v-icon>mdi-pencil</v-icon>
      </v-btn>

    </div>
    <v-dialog v-model="tableDialogIsVisible">
      <select-items-table-editor
        :resources="filteredResources"
        :resource="resource"
        @change="setResource"
        @delete="removeResource"
        @close-dialog="closeTableDialog"
      />
    </v-dialog>
  </div>
</template>

<script>
// import ObjectId from 'bson-objectid';
import SelectItemsTableEditor from '@/components/builder/SelectItemsTableEditor.vue';
import ResourceSelector from '@/components/builder/ResourceSelector.vue';
import {
  removeResource,
  setResource,
  createResource,
  resourceTypes,
  resourceLocations,
  appendResource,
} from '@/utils/resources';

export default {
  components: {
    SelectItemsTableEditor,
    ResourceSelector,
  },
  data() {
    return {
      tableDialogIsVisible: false,
    };
  },
  methods: {
    removeResource(id) {
      const newResources = removeResource(this.resources, id);
      this.$emit('set-survey-resources', newResources);
      this.$emit('set-control-source', null);
    },
    setResource(resource) {
      const newResources = setResource(this.resources, resource);
      this.$emit('set-survey-resources', newResources);
    },
    openTableDialog() {
      this.tableDialogIsVisible = true;
    },
    closeTableDialog() {
      this.tableDialogIsVisible = false;
    },
    createResourceHandler() {
      const newResource = createResource(
        this.resources,
        resourceTypes.ONTOLOGY_LIST,
        resourceLocations.EMBEDDED,
        {
          labelPrefix: 'Dropdown Items',
          defaultContent: [],
        },
      );
      this.$emit('set-survey-resources', appendResource(this.resources, newResource));
      this.$emit('set-control-source', newResource.id);
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
