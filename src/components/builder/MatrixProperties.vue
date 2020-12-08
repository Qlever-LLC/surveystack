<template>
  <div>
    <v-card-title class="px-0 d-flex justify-space-between">
      <div>
        Matrix
      </div>

    </v-card-title>
    <div class="d-flex">
      <v-btn
        color="primary"
        @click="matrixEditorDialog = true"
      >
        <v-icon left>mdi-view-column</v-icon>Open Editor
      </v-btn>
    </div>
    <v-dialog v-model="matrixEditorDialog">
      <app-matrix-editor
        :resources="resources"
        v-model="value"
        @change="setResource"
        @delete="removeResource"
        @close-dialog="matrixEditorDialog = false"
        @set-survey-resources="(val) => $emit('set-survey-resources', val)"
      />
    </v-dialog>
    <h4 class="mt-4">Config</h4>
    <v-text-field
      style="width: 20rem"
      class="my-2"
      v-model="value.config.addRowLabel"
      label="Add Row Label"
    />
  </div>
</template>

<script>
import appMatrixEditor from '@/components/builder/MatrixEditor.vue';

export default {
  components: {
    appMatrixEditor,
  },
  data() {
    return {
      matrixEditorDialog: false,
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
    selectResourceHandler(id) {
      this.$emit('set-control-source', id);
    },
  },
  props: {
    value: {
      type: Object,
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
      return this.resources.filter(resource => resource.type === 'MATRIX');
    },
  },
};
</script>
