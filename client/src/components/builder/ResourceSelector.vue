<template>
  <a-select
    label="Resource"
    :placeholder="placeholder"
    :value="value"
    @input="handleSelect"
    :items="items"
    item-text="label"
    item-value="id"
    :disabled="disabled"
    hide-details
    :outlined="outlined"
  />
</template>

<script>
import ASelect from '@/components/ui/ASelect.vue';

const NEW_RESOURCE_PREFIX = 'NEW_';

export default {
  props: {
    value: {
      required: true,
      validator: (prop) => typeof prop === 'string' || prop === null,
    },
    resources: {
      type: Array,
      default: () => [],
    },
    resourceTypes: {
      type: Array,
      default: () => [],
    },
    newResourceTypes: {
      type: Array,
      default: () => [],
      validator: (prop) => prop.every((p) => typeof p === 'string'),
    },
    disabled: {
      required: false,
    },
    placeholder: {
      type: String,
    },
    outlined: {
      type: Boolean,
    },
  },
  components: {
    ASelect,
  },
  computed: {
    filteredResources() {
      return this.resourceTypes.length === 0
        ? this.resources
        : this.resources.filter((resource) => this.resourceTypes.some((type) => type === resource.type));
    },
    items() {
      return [
        ...this.filteredResources,
        ...this.newResourceTypes.map((type) => ({
          label: `+ New ${type.toLowerCase().split('_').join(' ')}`,
          id: `${NEW_RESOURCE_PREFIX}${type}`,
        })),
      ];
    },
  },
  methods: {
    handleSelect(val) {
      if (val.includes(NEW_RESOURCE_PREFIX)) {
        this.$emit('on-new', val.replace(NEW_RESOURCE_PREFIX, ''));
      } else {
        this.$emit('on-select', val);
      }
    },
  },
};
</script>
