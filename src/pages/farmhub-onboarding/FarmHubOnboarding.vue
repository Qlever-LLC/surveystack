<template>
  <v-container>
    <v-card v-if="group">
      <v-card-title class="headline primary white--text">
        {{ group.name }} : Farm Hub Onboarding
      </v-card-title>
      <v-row
        class="pa-4"
        justify="space-between"
      >
        <v-col cols="4">
          <v-treeview
            :items="aggregators"
            :load-children="fetchChildren"
            transition
            return-object
          >

            <template v-slot:label="{ item }">
              <div
                class="d-flex flex-column mt-4"
                v-if="!!item.button"
              >
                <v-btn
                  outlined
                  color="primary"
                  @click="createNew(item)"
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
                >{{ item.payload.name || item.payload.farm_name }}
                  <v-progress-circular
                    indeterminate
                    v-if="!!item.loading"
                  />
                </span>
              </span>
            </template>
          </v-treeview>

          <div class="d-flex justify-center">
            <v-progress-circular
              indeterminate
              color="primary"
              v-if="aggregators.length < 2"
            />
          </div>
        </v-col>

        <v-divider vertical></v-divider>

        <v-col
          cols="7"
          class="pa-4"
        >
          <div
            v-if="!!active"
            class="display-1 text-center"
          >
            {{ active.payload.name }}
          </div>
          <app-aggregator
            :busy="busy"
            v-if="!!active && active.payload.type === 'farmos-aggregator'"
            @save="(a) => saveAggregator(a)"
            @testConnection="(a) => testConnection(a)"
            :aggregator="active.payload"
          />
          <app-farm-o-s-instance
            :busy="busy"
            v-if="!!active && active.type === 'farm'"
            @save="save"
            @testConnection="testConnection"
            :group="active.group"
            :instance="Object.assign({}, active.payload)"
            :aggregator="active.aggregator"
            :id="active.id"
          />

          <app-area
            v-if="!!active && active.item_type === 'area'"
            :area="Object.assign({}, active)"
          />

          <app-register
            v-if="!!active && active.item_type === 'register'"
            :meta='meta'
            :instance="Object.assign({}, registerTemplate)"
          />

        </v-col>
      </v-row>
    </v-card>

    <app-dialog
      v-model="dialog.show"
      @cancel="dialog.show = false"
      @confirm="dialog.show = false"
      width="400"
    >
      <template v-slot:title>{{ dialog.title }}</template>
      {{ dialog.text }}
    </app-dialog>
  </v-container>
</template>

<script>

import appAggregator from './Aggregator.vue';
import appFarmOSInstance from './FarmOSInstance.vue';
import appArea from './FarmOSArea.vue';
import appRegister from './FarmOSRegister.vue';
import api from '@/services/api.service';
import appDialog from '@/components/ui/Dialog.vue';


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

const registerTemplate = {
  url: '',
  email: '',
  site_name: '',
  registrant: '',
  units: 'us',
  plan: 'farmos-genmills',
  agree: false,
};

export default {
  components: {
    appAggregator,
    appFarmOSInstance,
    appArea,
    appRegister,
    appDialog,
  },
  data: () => ({
    busy: false,
    active: null,
    registerTemplate,
    meta: {},
    groupId: null,
    group: null,
    integrations: null,
    members: null,
    dialog: {
      show: false,
      title: '',
      text: '',
    },
    loadingAggregators: [],
    farms: {},
  }),
  computed: {
    hubaggregators() {
      if (!this.integrations) {
        return [];
      }
      const ag = this.integrations.filter(integration => integration.type === 'farmos-aggregator').map(integration => ({
        id: integration._id,
        payload: integration,
        type: 'aggregator',
        children: this.farms[integration._id] || [],
        loading: this.loadingAggregators.includes(integration._id),
      }));

      return ag;
    },
    aggregators() {
      return [
        {
          id: -3,
          item_type: 'aggregator',
          name: 'New Aggregator',

          button: true,
        },
        ...this.hubaggregators,
      ];
    },
  },
  methods: {
    async fetchChildren(item) {
      console.log('selected', this.tree);
      console.log('fetching children', item);
      if (item.type === 'aggregator') {
        this.loadingAggregators.push(item._id);
        try {
          const r = await api.get(`/farmos/integrations/${item.id}/farms`);
          const farms = r.data;
          const children = farms.map(f => ({
            id: `${item.id}:${f.farm_name}`,
            payload: f,
            group: item.payload.group,
            aggregator: item.id,
            type: 'farm',
            children: [],
          }));
          console.log('children', children);

          // eslint-disable-next-line no-param-reassign
          this.farms[item.id] = [{
            id: -1,
            item_type: 'farm',
            name: 'New Farm',
            button: true,
          }, ...children];
        } catch (error) {
          console.log('error', error);
        }

        this.loadingAggregators = this.loadingAggregators.filter(e => e !== item.id);
      } else if (item.item_type === 'farm') {
        const areas = await fetchFields();
        item.children.push(...areas);
      }
    },
    async testConnection(item) {
      console.log('testing connection for item', item);
      this.busy = true;

      try {
        const r = await api.post('/farmos/test', item);
        if (r.data && r.data.status === 'success') {
          this.dialog.text = 'Test Connection was successful';
          this.dialog.title = 'Success';
          this.dialog.show = true;
        } else {
          console.log('response', r);
          throw new Error(r.data.message);
        }
      } catch (error) {
        console.log('error', error);
        this.dialog.text = `Test Failed: ${error.message}`;
        this.dialog.title = 'Error';
        this.dialog.show = true;
      }
      this.busy = false;
    },
    async save(item) {
      console.log('saving item', item);
    },
    async saveAggregator(item) {
      this.busy = true;


      console.log('saving', item);
      const updated = Object.assign({}, item);
      console.log('updated', updated);

      try {
        const r = await api.put(`/group-integrations/${item._id}`, updated);
        console.log('response', r);
        if (r.data && r.data.ok === 1) {
          this.dialog.text = 'Updated Aggregator';
          this.dialog.title = 'Success';
          this.dialog.show = true;
        } else {
          throw new Error(r.data.message);
        }
      } catch (error) {
        console.log('error', error);
        this.dialog.text = `Error udpating Aggregator: ${error.message}`;
        this.dialog.title = 'Error';
        this.dialog.show = true;
      }
      this.busy = false;
    },
    async createNew(item) {
      console.log('creating new item', item);
      this.meta.groupId = '5e97401756f2b6000176e709';
      if (item.create === 'farm') {
        this.active = {
          name: 'Register new Farm on Aggregator',
          item_type: 'register',
        };
      }
    },
  },
  async created() {
    const { group } = this.$route.query;
    if (group) {
      this.groupId = group;
    }

    try {
      const { data } = await api.get(`/groups/${group}?populate=true`);
      this.group = { ...data };

      const { data: members } = await api.get(`/memberships?group=${group}&populate=true`);
      this.members = members;

      const { data: integrations } = await api.get(`/group-integrations?group=${group}&populate=true`);
      this.integrations = integrations;
    } catch (e) {
      console.log('something went wrong:', e);
    }
  },
};
</script>
