<template>
  <div>
    <a-select
      :items="fieldItems"
      item-title="text"
      item-value="value"
      label="Field"
      v-model="selectedField"
      hide-details />
    <a-select
      :items="operators.default"
      item-title="text"
      item-value="value"
      label="Operator"
      v-model="selectedOperator"
      hide-details
      return-object />
    <a-text-field label="Value" v-model="selectedValue" @keyup.enter="add" />

    <div class="d-flex justify-end">
      <a-btn class="ma-2" @click="$emit('show-advanced', true)" variant="text">Advanced</a-btn>
      <a-btn class="ma-2" variant="outlined" @click="reset">Reset</a-btn>
      <a-btn class="ma-2" @click="add" color="primary">Apply</a-btn>
    </div>

    <a-card variant="outlined" v-if="filters.length > 0">
      <a-list dense>
        <a-list-item v-for="(filter, i) in filters" :key="i" @click="select(filter)" dense>
          <div>
            <span class="font-weight-medium mr-1">{{ filter.field }}</span>
            <span class="font-weight-regular text-secondary mr-1">{{ filter.operator.text }}</span>
            <span class="font-weight-boldmr-1">{{ filter.value }}</span>
          </div>
          <template v-slot:append>
            <a-list-item-action @click="remove(i)">
              <a-btn icon small>
                <a-icon>mdi-trash-can-outline</a-icon>
              </a-btn>
            </a-list-item-action>
          </template>
        </a-list-item>
      </a-list>
    </a-card>
  </div>
</template>

<script>
export default {
  props: {
    queryList: {
      type: Array,
      required: true,
    },
    basicFilters: {
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
      return this.queryList.map((item) => item.name);
    },
  },
  methods: {
    add() {
      if (!this.selectedField || !this.selectedOperator) {
        this.$emit('apply-basic-filters', this.filters);
        return;
      }
      const { key, type } = this.queryList.find((item) => item.name === this.selectedField);

      console.log(this.selectedField);
      let v = this.selectedValue;
      if (type === 'number') {
        v = Number(v);
      } else if (type === '$oid') {
        v = { $oid: v };
      } else if (type === '$date') {
        v = { $date: v };
      }
      console.log(this.selectedOperator);

      const value = this.selectedOperator.value === '$eq' ? v : { [this.selectedOperator.value]: v };
      const query = { [key]: value };

      const idx = this.filters.findIndex((item) => item.key === key);
      const filter = {
        key,
        query,
        field: this.selectedField,
        operator: this.selectedOperator,
        value: this.selectedValue,
      };
      if (idx >= 0) {
        this.filters.splice(idx, 1, filter);
      } else {
        this.filters.push(filter);
      }
      this.$emit('apply-basic-filters', this.filters);
    },
    remove(idx) {
      this.filters.splice(idx, 1);
      this.$emit('apply-basic-filters', this.filters);
    },
    select({ field, operator, value }) {
      this.selectedField = field;
      this.selectedOperator = operator;
      this.selectedValue = value;
    },
    reset() {
      this.selectedField = null;
      this.selectedOperator = null;
      this.selectedValue = null;
      this.filters = [];
      this.$emit('reset');
    },
  },
  created() {
    this.filters = this.basicFilters;
  },
};
</script>
