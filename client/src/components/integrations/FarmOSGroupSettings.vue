<template>
  <div>
    <a-dialog v-model="upgradeDialog" width="400">
      <a-card>
        <a-card-title> Upgrade </a-card-title>
        <a-card-text>
          In order to change your current plan, please contact
          <a href="mailto:info@surveystack.io">info@surveystack.io</a>.
        </a-card-text>
      </a-card>
    </a-dialog>

    <a-card v-if="superAdmin" class="px-4 mb-4">
      <a-card-title>Super Admin</a-card-title>
      <a-card-text>
        <div class="d-flex flex-grow-1">
          <a-text-field
            class="mr-4 flex-shrink-1 flex-grow-0"
            variant="outlined"
            v-model="seats"
            label="Max Seats"
            type="number"
            @update:modelValue="$emit('seatsChanged', seats)" />

          <a-select
            variant="outlined"
            class="flex-grow-1 flex-shrink-0"
            label="Select FarmOS Plans for Group"
            multiple
            @update:modelValue="$emit('plansChanged', selectedPlans)"
            v-model="selectedPlans"
            :items="plans"
            :item-value="(p) => p._id"
            :item-title="(p) => `${p.planName} (${p.planUrl})`"
            chipSlot>
            <template v-slot:chip="{ props, item }">
              <a-chip v-bind="props" closable>
                {{ item.title }}
              </a-chip>
            </template>
          </a-select>
        </div>
        <a-btn color="red" @click="$emit('deactivate')">Deactivate FarmOS for Group</a-btn>
      </a-card-text>
    </a-card>
    <div class="d-flex justify-space-between">
      <div>
        <h1>{{ groupInfos.name }}</h1>
        <h2>Connected Members & Farms</h2>

        <div class="pa-3">
          <p class="font-weight-bold">Settings</p>
          <a-container class="pa-0" fluid>
            <a-checkbox
              class="ma-0 pa-0"
              label="Add this group to the Coffee Shop"
              v-model="groupInfos.groupHasCoffeeShopAccess"
              :ripple="false"
              :disabled="!canAddCoffeeShop"
              hide-details
              @update:modelValue="$emit('addGrpCoffeeShop', $event)">
              <a-tooltip bottom activator="parent">
                Talk to your parent group administrator to enable this option
              </a-tooltip>
            </a-checkbox>
            <a-checkbox
              v-if="groupInfos.isDomainRoot"
              class="ma-0 pa-0"
              hide-details
              :ripple="false"
              v-model="groupInfos.allowSubgroupsToJoinCoffeeShop"
              @update:modelValue="$emit('allowSbGrpsJoinCoffeeShop', $event)"
              :label="`Allow subgroups to join the Coffee Shop`" />
            <a-checkbox
              v-if="groupInfos.isDomainRoot"
              class="ma-0 pa-0"
              :ripple="false"
              v-model="groupInfos.allowSubgroupAdminsToCreateFarmOSInstances"
              @update:modelValue="$emit('allowSbGrpsAdminsCreateFarmOSFarms', $event)"
              label="Allow subgroups admins to create FarmOS Farms through Survey Stack" />
          </a-container>
        </div>
      </div>
      <div class="d-flex flex-column" v-if="groupInfos.seats && groupInfos.isDomainRoot">
        <div class="d-flex justify-end">{{ groupInfos.seats.current }} / {{ groupInfos.seats.max }} accounts</div>
        <div class="d-flex justify-end align-center my-4">
          <a-btn variant="outlined" @click="upgradeDialog = true">Upgrade</a-btn>
          <!-- <a-btn variant="outlined" class="ml-2">Learn More</a-btn> -->
        </div>
      </div>
    </div>

    <div class="search">
      <a-text-field variant="solo" placeholder="Search" prepend-inner-icon="mdi-magnify" clear-icon v-model="search" />
    </div>
    <FarmOSGroupTable
      :members="filteredMembers"
      @open="(item) => $emit('open', item)"
      @connect="(item) => $emit('connect', item)"
      @disconnect="(item) => $emit('disconnect', item)" />
  </div>
</template>

<script>
import { computed, ref } from 'vue';
import FarmOSGroupTable from './FarmOSGroupTable.vue';

export default {
  components: {
    FarmOSGroupTable,
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

<style scoped lang="scss">
.v-data-table :deep(.v-data-table__wrapper) {
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
