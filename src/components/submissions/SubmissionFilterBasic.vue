<template>
  <v-container>
    <v-select
      :items="fieldItems"
      label="Field"
      v-model="selectedField"
      hide-details
    />
    <v-select
      :items="operators.default"
      label="Operator"
      v-model="selectedOperator"
      hide-details
    />
    <v-text-field
      label="Value"
      v-model="selectedValue"
    />

    <div class="d-flex justify-end mt-2">
      <v-btn
        @click="$emit('showAdvanced')"
        text
      >Advanced</v-btn>
      <v-btn
        @click="add"
        color="primary"
      >Add</v-btn>
    </div>

    <ul>
      <li
        v-for="(filter,i) in filters"
        :key="i"
      >
        {{filter}}
      </li>
    </ul>

  </v-container>
</template>

<script>
export default {
  props: {
    queryList: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      selectedField: null,
      selectedOperator: null,
      selectedValue: null,
      filters: [],
      operators: {
        default: [
          {
            text: '= equals',
            value: '$eq',
          },
          {
            text: '> greater than',
            value: '$gt',

          },
          {
            text: '< less than',
            value: '$lt',
          },
          {
            text: '>= greater than or equal',
            value: '$gte',
          },
          {
            text: '<= less than or equal',
            value: '$lte',
          },
        ],
      },
    };
  },
  computed: {
    fieldItems() {
      return this.queryList.map(item => item.name);
    },
  },
  methods: {
    add() {
      if (!this.selectedField || !this.selectedOperator || !this.selectedValue) {
        return;
      }
      const { key, type } = this.queryList.find(item => item.name === this.selectedField);

      console.log(this.selectedField);
      let v = this.selectedValue;
      if (type === 'number') {
        v = Number(v);
      }
      console.log(this.selectedOperator);

      const value = (this.selectedOperator === '$eq') ? v : { [this.selectedOperator]: v };
      this.filters.push({ [key]: value });
    },
  },
};
</script>
