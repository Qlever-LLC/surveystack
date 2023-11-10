<template>
  <div>
    <v-dialog v-model="upgradeDialog" width="400">
      <a-card>
        <v-card-title> Upgrade </v-card-title>
        <v-card-text>
          In order to change your current plan, please contact
          <a href="mailto:info@surveystack.io">info@surveystack.io</a>.
        </v-card-text>
      </a-card>
    </v-dialog>

    <a-card v-if="superAdmin" class="px-4 mb-4">
      <v-card-title>Super Admin</v-card-title>
      <v-card-text>
        <div class="d-flex flex-grow-1">
          <v-text-field
            class="mr-4 flex-shrink-1 flex-grow-0"
            outlined
            v-model="seats"
            label="Max Seats"
            type="number"
            @change="$emit('seatsChanged', seats)"
          />

          <v-autocomplete
            outlined
            class="flex-grow-1 flex-shrink-0"
            label="Select FarmOS Plans for Group"
            multiple
            deletable-chips
            @change="$emit('plansChanged', selectedPlans)"
            v-model="selectedPlans"
            :items="plans"
            :item-value="(p) => p._id"
            small-chips
            :item-text="(p) => `${p.planName} (${p.planUrl})`"
          >
          </v-autocomplete>
        </div>
        <v-btn color="red" @click="$emit('deactivate')" dark>Deactivate FarmOS for Group</v-btn>
      </v-card-text>
    </a-card>
    <div class="d-flex justify-space-between">
      <div>
        <h1>{{ groupInfos.name }}</h1>
        <h2>Connected Members & Farms</h2>

        <div class="pa-3">
          <p class="font-weight-bold">Settings</p>
          <v-container class="pa-0" fluid>
            <v-tooltip bottom :disabled="canAddCoffeeShop">
              <template v-slot:activator="{ on, attrs }">
                <div v-bind="attrs" v-on="on">
                  <v-checkbox
                    class="ma-0 pa-0"
                    label="Add this group to the Coffee Shop"
                    v-model="groupInfos.groupHasCoffeeShopAccess"
                    :ripple="false"
                    :disabled="!canAddCoffeeShop"
                    hide-details
                    @change="$emit('addGrpCoffeeShop', $event)"
                  />
                </div>
              </template>
              <span>Talk to your parent group administrator to enable this option</span>
            </v-tooltip>
            <v-checkbox
              v-if="groupInfos.isDomainRoot"
              class="ma-0 pa-0"
              hide-details
              :ripple="false"
              v-model="groupInfos.allowSubgroupsToJoinCoffeeShop"
              @change="$emit('allowSbGrpsJoinCoffeeShop', $event)"
              :label="`Allow subgroups to join the Coffee Shop`"
            />
            <v-checkbox
              v-if="groupInfos.isDomainRoot"
              class="ma-0 pa-0"
              :ripple="false"
              v-model="groupInfos.allowSubgroupAdminsToCreateFarmOSInstances"
              @change="$emit('allowSbGrpsAdminsCreateFarmOSFarms', $event)"
              label="Allow subgroups admins to create FarmOS Farms through Survey Stack"
            />
          </v-container>
        </div>
      </div>
      <div class="d-flex flex-column" v-if="groupInfos.seats && groupInfos.isDomainRoot">
        <div class="d-flex justify-end">{{ groupInfos.seats.current }} / {{ groupInfos.seats.max }} accounts</div>
        <div class="d-flex justify-end align-center my-4">
          <v-btn outlined @click="upgradeDialog = true">Upgrade</v-btn>
          <!-- <v-btn outlined class="ml-2">Learn More</v-btn> -->
        </div>
      </div>
    </div>

    <div class="search">
      <v-text-field solo placeholder="Search" prepend-icon="mdi-magnify" clear-icon v-model="search"></v-text-field>
    </div>
    <FarmOSGroupTable
      :members="filteredMembers"
      @open="(item) => $emit('open', item)"
      @connect="(item) => $emit('connect', item)"
      @disconnect="(item) => $emit('disconnect', item)"
    />
  </div>
</template>

<script>
import { ref, computed } from '@vue/composition-api';
import FarmOSGroupTable from './FarmOSGroupTable.vue';
import ACard from '@/components/ui/ACard.vue';

export default {
  components: {
    FarmOSGroupTable,
    ACard,
  },
  props: {
    groupInfos: {
      type: Object,
      required: true,
    },
    superAdmin: {
      type: Boolean,
      required: true,
    },
    plans: {
      type: Array,
      required: true,
    },
  },
  emits: [
    'addGrpCoffeeShop',
    'plansChanged',
    'allowSbGrpsJoinCoffeeShop',
    'allowSbGrpsAdminsCreateFarmOSFarmsInSS',
    'connect',
    'seatsChanged',
    'deactivate',
  ],
  setup(props) {
    const search = ref('');
    const selectedPlans = ref(props.groupInfos.planIds);
    const seats = ref(props.groupInfos.seats.max);
    const upgradeDialog = ref(false);

    const canAddCoffeeShop = computed(
      () => props.groupInfos.isDomainRoot || props.groupInfos.allowSubgroupsToJoinCoffeeShop
    );

    const filteredMembers = computed(() => {
      const s = search.value.toLowerCase().trim();
      if (!s) {
        return props.groupInfos.members;
      }

      const strHas = (attr) => {
        if (attr && attr.toLowerCase().trim().includes(s)) {
          return true;
        }
        return false;
      };

      return props.groupInfos.members.filter((m) => {
        if (strHas(m.name)) {
          return true;
        }

        if (strHas(m.email)) {
          return true;
        }

        if (
          m.connectedFarms.some((f) => {
            return strHas(f.instanceName);
          })
        ) {
          return true;
        }

        if (
          m.connectedFarms.some((f) => {
            return f.groups.some((g) => {
              return strHas(g.path);
            });
          })
        ) {
          return true;
        }

        return false;
      });
    });

    return {
      search,
      filteredMembers,
      selectedPlans,
      seats,
      upgradeDialog,
      canAddCoffeeShop,
    };
  },
};
</script>

<style scoped>
.v-data-table /deep/ .v-data-table__wrapper {
  overflow: unset;
}

.v-data-table__wrapper > table > tbody > tr:hover {
  background: inherit !important;
}

.v-data-table >>> div > table {
  width: 100%;
  border-spacing: 4px !important;
}

.box {
  align-items: center;
  padding: 16px 4px;
  background-color: rgb(243, 242, 242);
  border-bottom: 1px solid rgb(192, 190, 190);
}

.nOthers {
  color: grey;
  cursor: pointer;
}

th {
  font-weight: normal;
  height: initial;
  padding: 0.5rem 1rem !important;
}

tr {
  vertical-align: top;
}

td {
  border: none !important;
}
</style>
