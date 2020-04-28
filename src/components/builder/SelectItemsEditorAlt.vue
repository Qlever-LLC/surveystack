<template>
  <div>
    <v-card-title class="px-0 d-flex justify-space-between">
      <span>
        Select Options
      </span>

    </v-card-title>
    <div class="text-center d-flex">
        <!-- v-model="value"  -->
      <resource-selector
        :resources="resources"
        :value="value"
        :resourceTypes="['ONTOLOGY_LIST']"
        @on-new="createResourceHandler"
        @on-select="selectResourceHandler"
      />
      <v-btn
        icon
        @click.stop="openTableDialog"
      >
        <!-- Edit entries -->
        <!-- <v-icon class="ml-2">mdi-table</v-icon> -->
        <v-icon class="ml-2 mt-3">mdi-pencil</v-icon>
      </v-btn>

    </div>
    <v-dialog v-model="tableDialogIsVisible">
        <!-- v-if="resource" -->
      <select-items-table-editor
        :resource="resource"
        @change="setResource"
        @close-dialog="closeTableDialog"
      />
    </v-dialog>
  </div>
</template>

<script>
import ObjectId from 'bson-objectid';
import SelectItemsTableEditor from '@/components/builder/SelectItemsTableEditor.vue';
import ResourceSelector from '@/components/builder/ResourceSelector.vue';

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
    setItems(items) {
      console.log('set items', items);
      // this.$emit('set-control-source', items);
    },
    setResource(resource) {
      console.log('set resource', resource);
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
      console.log('create resource');
      const id = new ObjectId().toString();
      this.$emit('set-survey-resources', [...this.resources, {
        label: 'Dropdown Items',
        handle: 'dropdown_items',
        id,
        type: 'ONTOLOGY_LIST',
        location: 'EMBEDDED',
        content: [],
      }]);
      this.$emit('set-control-source', id);
      this.openTableDialog();
    },
    selectResourceHandler(id) {
      console.log('select resource', id);
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
  },
};
</script>

<style>

</style>
