<template>
  <div>
    <h3>FarmOS Farm picker</h3>
    <a-select
      class="mt-2"
      :items="aggregators"
      item-title="text"
      v-model="selectedAggregator"
      label="Aggregator"
      variant="outlined"
      :hint="`Found ${aggregators.length} aggregators`"
      persistent-hint
    />

    <a-select
      class="mt-2"
      :items="farms"
      item-title="text"
      item-value="value"
      v-model="selectedFarm"
      label="Farm"
      variant="outlined"
      :hint="`Found ${farms.length} farms`"
      persistent-hint
    />
  </div>
</template>

<script>
export default {
  props: {
    aggregators: {
      type: Array,
    },
    data: {
      type: Object,
      default: () => {},
    },
  },
  data() {
    return {
      selectedAggregator: this.data.aggregator || null,
      selectedFarm: this.data.farm || null,
    };
  },
  computed: {
    farms() {
      if (!this.aggregators || this.aggregators.length === 0) {
        return [];
      }

      if (!this.selectedAggregator) {
        return [];
      }

      return this.aggregators
        .find((aggregator) => aggregator._id === this.selectedAggregator)
        .farms.map((farm) => ({
          text: `${farm.farm_name} - ${farm.url}`,
          value: farm.id,
        }));
    },
  },
  watch: {
    selectedFarm: {
      async handler() {
        const a = this.aggregators.find((aggregator) => aggregator._id === this.selectedAggregator);
        const f = a.farms.find((farm) => farm.id === this.selectedFarm);
        const data = {
          name: f.farm_name,
          url: f.url,
          aggregator: a._id,
          farm: f.id,
        };
        this.$emit('farm-selected', data);
      },
    },
  },
};
</script>
