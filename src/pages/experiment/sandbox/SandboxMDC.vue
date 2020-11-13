<template>
  <v-container>
    <v-card>
      <v-card-title class="indigo white--text headline">
        Farmos Configuration
      </v-card-title>
      <v-row
        class="pa-4"
        justify="space-between"
      >
        <v-col cols="5">
          <v-treeview
            :items="aggregators"
            :load-children="fetchChildren"
            transition
            return-object
          >

            <template v-slot:label="{ item }">
              <div
                class="v-flex flex-column mt-4"
                v-if="!!item.button"
              >
                <v-btn
                  outlined
                  color="primary"
                >
                  <v-icon left>mdi-plus</v-icon>{{ item.name }}
                </v-btn>
                <v-divider class="mt-4" />
              </div>
              <span v-else>
                <v-icon left>
                  {{ item.icon }}
                </v-icon>
                <span
                  style="cursor: pointer"
                  @click="active = item"
                >{{ item.name }}</span>
              </span>
            </template>

          </v-treeview>
        </v-col>

        <v-divider vertical></v-divider>

        <v-col class="d-flex text-center pa-4 flex-column">
          <div
            v-if="!!active"
            class="display-1"
          >
            {{ active.name }}
          </div>
          <app-aggregator
            v-if="!!active && active.item_type === 'aggregator'"
            @save="save"
            @testConnection="testConnection"
            :aggregator="Object.assign({}, active)"
          />
          <app-farm-o-s-instance
            v-if="!!active && active.item_type === 'farm'"
            @save="save"
            @testConnection="testConnection"
            :instance="Object.assign({}, active)"
          />

          <app-area
            v-if="!!active && active.item_type === 'area'"
            :area="Object.assign({}, active)"
          />

        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<script>
import AppAggregator from './Aggregator.vue';
import AppFarmOSInstance from './FarmOSInstance.vue';
import AppArea from './FarmOSArea.vue';


function farmOSPlanting() {

}


const fetchFarms = async aggregator => [
  {
    id: -1,
    name: 'New Farm',
    button: true,
  },
  {
    id: 10,
    _id: '5f22baf7e5ac0e0001b9843c',
    name: 'greg.farmos.net',
    url: 'greg.farmos.net',
    item_type: 'farm',
    children: [],
    icon: 'mdi-home-variant',
    groupId: '5e97401756f2b6000176e709',
  },
  {
    id: 20,
    _id: '5f22baf7e5ac0e0001b9843d',
    name: 'dan.farmos.net',
    url: 'dan.farmos.net',
    item_type: 'farm',
    children: [],
    icon: 'mdi-home-variant',
    groupId: '5e97401756f2b6000176e709',
  },

];

const fetchFields = async (aggregator, farm) => [
  {
    id: -2,
    name: 'New Area',
    button: true,
  },
  {
    id: 100,
    name: 'East Field',
    geometries: [

    ],
    item_type: 'area',
    icon: 'mdi-map-search',
  },
  {
    id: 200,
    name: 'West Field',
    geometries: [

    ],
    item_type: 'area',
    icon: 'mdi-map-search',

  },

];


const aggregators = [
  {
    id: -3,
    item_type: 'aggregator',
    name: 'New Aggregator',

    button: true,
  },
  {
    id: 1,
    url: 'ourscitest.farmos.net',
    name: 'Oursci Aggregator',
    item_type: 'aggregator',
    icon: 'mdi-account',
    apiKey: '1',
    children: [],
  },
  {
    id: 3,
    url: 'gm-oat.farmos.net',
    name: 'GM Oat Farms',
    item_type: 'aggregator',
    children: [],
    apiKey: '2',
    icon: 'mdi-account',
  },
  {
    id: 2,
    url: 'gm-grains.farmos.net',
    name: 'GM Small Grain Frams',
    item_type: 'aggregator',
    children: [],
    apiKey: '1',
    icon: 'mdi-account',
  },

];

const fetchChildren = async (item) => {
  console.log('fetching children', item);
  if (item.item_type === 'aggregator') {
    const farms = await fetchFarms();
    console.log('farms', farms);

    item.children.push(...farms);
  } else if (item.item_type === 'farm') {
    const areas = await fetchFields();
    item.children.push(...areas);
  }
};

export default {
  components: {
    AppAggregator,
    AppFarmOSInstance,
    AppArea,
  },
  data: () => ({
    aggregators,
    active: null,
  }),
  methods: {
    async fetchChildren(item) {
      console.log('selected', this.tree);
      return fetchChildren(item);
    },
    async testConnection(item) {
      console.log('testing connection for item', item);
    },
    async save(item) {
      console.log('saving item', item);
    },
  },
};
</script>
