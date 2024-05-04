<template>
  <a-dialog v-model="open">
    <template v-slot:activator="{ props }">
      <a-text-field
        v-bind="props"
        label="Resource"
        :modelValue="getLabel"
        placeholder="Add Columns"
        class="mt-6"
        hide-details
        readonly
        variant="outlined"
        :disabled="disabled" />
    </template>

    <matrix-editor
      :resources="resources"
      :allowSetAllowHide="allowSetAllowHide"
      :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)"
      @change="setResource"
      @delete="removeResource"
      @close-dialog="open = false"
      @set-survey-resources="(val) => $emit('set-survey-resources', val)"
      @set-control-required="(val) => $emit('set-control-required')" />
  </a-dialog>
</template>

<script>
import MatrixEditor from '@/components/builder/MatrixEditor.vue';

export default {
  components: {
    MatrixEditor,
  },
  props: {
    modelValue: {
      type: Object,
    },
    resources: {
      type: Array,
      default: () => [],
    },
    disabled: {
      type: Boolean,
      required: false,
    },
    allowSetAllowHide: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      open: false,
    };
  },
  computed: {
    resource() {
      return this.resources.find((resource) => resource.id === this.modelValue);
    },
    filteredResources() {
      return this.resources.filter((resource) => resource.type === 'MATRIX');
    },
    getLabel() {
      return this.modelValue && Array.isArray(this.modelValue.content)
        ? this.modelValue.content
            .map((item) => item.label)
            .filter(Boolean)
            .join(', ')
        : undefined;
    },
  },
  methods: {
    removeResource(id) {
      const index = this.resources.findIndex((r) => r.id === id);
      const newResources = [...this.resources.slice(0, index), ...this.resources.slice(index + 1)];
      this.$emit('set-survey-resources', newResources);
      this.$emit('set-control-source', null);
    },
    setResource(resource) {
      const index = this.resources.findIndex((r) => r.id === resource.id);
      const newResources = [...this.resources.slice(0, index), resource, ...this.resources.slice(index + 1)];
      this.$emit('set-survey-resources', newResources);
    },
    selectResourceHandler(id) {
      this.$emit('set-control-source', id);
    },
  },
};
</script>
