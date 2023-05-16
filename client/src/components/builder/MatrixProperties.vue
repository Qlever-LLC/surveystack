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
      @set-survey-resources="$emit('set-survey-resources', $event)"
      @set-control-required="$emit('set-control-required', $event)"
    />
  </v-dialog>
</template>

<script>
import MatrixEditor from '@/components/builder/MatrixEditor.vue';
import { removeResource, setResource } from '@/utils/resources';

export default {
  components: {
    MatrixEditor,
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
      this.$emit('set-survey-resources', removeResource(this.resource, id));
    },
    setResource(resource) {
      this.$emit('set-survey-resources', setResource(this.resources, resource));
    },
  },
};
</script>
