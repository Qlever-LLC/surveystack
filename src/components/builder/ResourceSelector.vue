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
    newResourceType: {
      type: String,
      required: true,
    },
    disabled: {
      required: false,
    },
    // onNew: {
    //   type: Function,
    //   default: () => {},
    // },
    // onSelect: {
    //   type: Function,
    //   default: () => {},
    // },
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
        {
          label: '+ New',
          id: `NEW_${this.newResourceType}`,
        },
      ];
    },
  },
  methods: {
    handleSelect(val) {
      if (val === `NEW_${this.newResourceType}`) {
        this.$emit('on-new');
      } else {
        this.$emit('on-select', val);
      }
    },
  },
};
</script>
