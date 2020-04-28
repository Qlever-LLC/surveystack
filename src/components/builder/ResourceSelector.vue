<template>
    <v-select
      :items="items"
      item-text="label"
      item-value="id"
      :value="value"
      @input="handleSelect"
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
    items() {
      const filteredResources = this.resources.filter(
        resource => this.resourceTypes.some(
          type => type === resource.type,
        ),
      );
      return [
        ...filteredResources,
        {
          label: '+ New',
          id: '',
        },
      ];
    },
  },
  methods: {
    handleSelect(val) {
      if (val === null || val === '') {
        this.$emit('on-new');
      } else {
        this.$emit('on-select', val);
      }
    },
  },
};
</script>

<style>

</style>
