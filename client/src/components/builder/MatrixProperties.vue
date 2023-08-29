<template>
  <v-dialog v-model="open" @click:outside="$refs.anchorRef.blur()">
    <template v-slot:activator="{ on, attrs }">
      <v-text-field
        v-on="on"
        v-bind="attrs"
        ref="anchorRef"
        label="Resource"
        :value="getLabel"
        placeholder="Add Columns"
        class="mt-6"
        :class="$vnode.data.staticClass"
        hide-details
        readonly
        outlined
        :disabled="disabled"
      />
    </template>

    <matrix-editor
      :resources="resources"
      :allowSetAllowHide="allowSetAllowHide"
      v-model="value"
      @change="setResource"
      @delete="removeResource"
      @close-dialog="open = false"
      @set-survey-resources="(val) => $emit('set-survey-resources', val)"
      @set-control-required="(val) => $emit('set-control-required')"
    />
  </v-dialog>
</template>

<script>
import MatrixEditor from '@/components/builder/MatrixEditor.vue';
import ATextField from '@/components/ui/ATextField.vue';

export default {
  components: {
    MatrixEditor,
    ATextField,
  },
  props: {
    value: {
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
      return this.resources.find((resource) => resource.id === this.value);
    },
    filteredResources() {
      return this.resources.filter((resource) => resource.type === 'MATRIX');
    },
    getLabel() {
      return this.value && Array.isArray(this.value.content)
        ? this.value.content
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
