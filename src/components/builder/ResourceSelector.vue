<template>
  <v-select
    :items="items"
    item-text="label"
    item-value="id"
    :value="value"
    :disabled="disabled"
    @input="handleSelect"
    placeholder="Choose a resource"
    outlined
  />
</template>

<script>
const NEW_RESOURCE_PREFIX = 'NEW_';

export default {
  props: {
    value: {
      // required: true,
      // validator: prop => typeof prop === 'string' || prop === null,
    },
    resources: {
      type: Array,
      default: () => ([]),
    },
    resourceTypes: {
      type: Array,
      default: () => ([]),
    },
    newResourceTypes: {
      type: Array,
      required: true,
      validator: prop => prop.every(p => typeof p === 'string'),
    },
    disabled: {
      required: false,
    },
  },
  computed: {
    filteredResources() {
      return this.resourceTypes.length === 0
        ? this.resources
        : this.resources.filter(
          resource => this.resourceTypes.some(
            type => type === resource.type,
          ),
        );
    },
    items() {
      return [
        ...this.filteredResources,
        // {
        //   label: '+ New ',
        //   id: `${NEW_RESOURCE_PREFIX}${this.newResourceTypes[0]}`,
        // },
        ...(this.newResourceTypes.map((type, i) => ({
          // label: i === 0
          //   ? '+ New '
          //   : `+ New ${type.toLowerCase().split('_').join(' ')}`,
          label: `+ New ${type.toLowerCase().split('_').join(' ')}`,
          id: `${NEW_RESOURCE_PREFIX}${type}`,
        }))),
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
