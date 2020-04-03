<template>
  <div>
    <h3>Custom Farm picker</h3>
    <v-select
      class="mt-2"
      :items="aggregators"
      v-model="selectedAggregator"
      label="Aggregator"
      outlined
      :hint="`Found ${aggregators.length} aggregators`"
      persistent-hint
    ></v-select>

    <v-select
      class="mt-2"
      :items="farms"
      v-model="selectedFarm"
      label="Farm"
      outlined
      :hint="`Found ${farms.length} farms`"
      persistent-hint
    ></v-select>

  </div>
</template>

<script>
export default {
  props: {
    aggregators: {
      type: Array,
    },
  },
  data() {
    return { selectedAggregator: null, selectedFarm: null };
  },
  computed: {
    farms() {
      if (!this.selectedAggregator) {
        return [];
      }

      return this.aggregators.find(aggregator => aggregator._id === this.selectedAggregator).farms.map(farm => ({
        text: `${farm.farm_name} - ${farm.url}`,
        value: farm.id,
      }));
    },
  },
  watch: {
    selectedFarm: {
      async handler(newVal, oldVal) {
        const a = this.aggregators.find(aggregator => aggregator._id === this.selectedAggregator);
        const f = a.farms.find(farm => farm.id === this.selectedFarm);
        const data = { name: f.farm_name, url: f.url, aggregatorURL: a.url };
        this.$emit('farm-selected', data);
      },
    },
  },
};
</script>
