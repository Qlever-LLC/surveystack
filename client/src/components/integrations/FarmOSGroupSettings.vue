<template>
  <div>
    <div v-if="superAdmin" class="d-flex justify-space-between">
      <v-autocomplete
        outlined
        label="Super Admin: Select Plans for Group"
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
    <div class="d-flex justify-space-between">
      <div>
        <h1>{{ groupInfos.name }}</h1>
        <h2>Connected Members & Farms</h2>

        <div class="pa-3">
          <p class="font-weight-bold">Settings</p>
          <v-container class="pa-0" fluid>
            <v-checkbox
              disabled
              class="ma-0 pa-0"
              hide-details
              :ripple="false"
              v-model="groupInfos.groupHasCoffeeShopAccess"
              @input="$emit('addGrpCoffeeShop', $event.target.value, groupInfos.groupId)"
              label="Add this group to the Coffee Shop"
            ></v-checkbox>
            <v-checkbox
              disabled
              class="ma-0 pa-0"
              hide-details
              :ripple="false"
              v-model="groupInfos.allowSubgroupsToJoinCoffeeShop"
              @input="$emit('allowSbGrpsJoinCoffeeShop', $event.target.value)"
              :label="`Allow subgroups to join the Coffee Shop`"
            ></v-checkbox>
            <v-checkbox
              disabled
              class="ma-0 pa-0"
              :ripple="false"
              v-model="groupInfos.allowSubgroupAdminsToCreateFarmOSInstances"
              @input="$emit('allowSbGrpsAdminsCreateFarmOSFarmsInSS', $event.target.value)"
              label="Allow subgroups admins to create FarmOS Farms through Survey Stack"
            >
            </v-checkbox>
          </v-container>
        </div>
      </div>
      <div class="d-flex flex-column">
        <div class="d-flex justify-end" v-if="groupInfos.seats">
          {{ groupInfos.name }} has {{ groupInfos.seats.current }} / {{ groupInfos.seats.max }} accounts
        </div>
        <div class="d-flex justify-end" v-else>
          {{ groupInfos.name }}
        </div>
        <div class="d-flex justify-end align-center">
          <v-btn color="secondary" text class="mx-2">Upgrade</v-btn> or
          <v-btn color="secondary" text class="mx-2">Learn More</v-btn>
        </div>
      </div>
    </div>
    <v-data-table
      :headers="headers"
      :items="filteredMembers"
      item-key="name"
      class="elevation-1"
      hide-default-footer
      hide-default-header
      disable-pagination
    >
      <template v-slot:header="{ props: { headers } }">
        <thead>
          <tr>
            <th v-for="(h, i) in headers" :key="'h1' + i">
              {{ h.text }}
            </th>
          </tr>
          <tr>
            <th v-for="(aHS, i) in arrHeaderSearch" :key="i">
              <v-text-field
                v-model="arrHeaderSearch[i]"
                label="Search"
                placeholder="Search"
                solo
                dense
                single-line
                append-icon="mdi-magnify"
                hide-details
                class="mb-2"
              ></v-text-field>
            </th>
          </tr>
        </thead>
      </template>

      <template v-slot:item="{ item, index }">
        <tr
          v-for="(connectedFarm, idx) in item.connectedFarms.filter((f) => !f.skip)"
          :key="`${item.user}-instance-${idx}`"
        >
          <td class="pa-4" :class="{ box: idx == 0 }">
            <div v-if="idx == 0" class="d-flex align-start justify-space-between">
              <span class="d-flex align-center">
                <div class="d-flex flex-column">
                  <span v-if="item.name">
                    <span v-if="item.admin" class="mdi mdi-crown pr-1"></span> {{ item.name }} ({{ item.email }})</span
                  >
                  <div class="d-flex flex-column font-weight-light">
                    <div v-for="(g, gidx) in item.groups" :key="`${item.user}-grp-${gidx}`">{{ g.breadcrumb }}</div>
                  </div>
                </div>
              </span>
              <span v-if="item.name">
                <v-btn text color="green" x-small @click="$emit('connect', item)">+ connect</v-btn>
              </span>
            </div>
          </td>
          <td class="box pa-4">
            <div v-if="connectedFarm.instanceName" class="d-flex align-center justify-space-between">
              <span class="d-flex align-center">
                <span v-if="connectedFarm.owner" class="mdi mdi-crown pr-1"></span>
                <span>{{ connectedFarm.instanceName }}</span>
              </span>
              <span class="d-flex" style="flex-wrap: nowrap">
                <v-btn text color="blue" disabled x-small>access</v-btn>
                <v-btn @click="$emit('disconnect', item.user, connectedFarm.instanceName)" text color="red" x-small>
                  remove</v-btn
                >
              </span>
            </div>
            <div v-else>no farmos connected</div>
          </td>
          <td class="box pa-4">
            <div v-if="connectedFarm.groups">
              <span v-for="(grp, iidx) in connectedFarm.groups" :key="`connected-${idx}-${iidx}`">
                <span v-if="iidx === 0 || iidx === 1 || developMbships[index].value">
                  {{ grp.breadcrumb || grp.name }}
                  <br />
                </span>
                <span
                  v-if="iidx === 2 && !developMbships[index].value"
                  @click="toggleDevelopMbships(index)"
                  class="nOthers"
                >
                  (+{{ connectedFarm.groups.length - 2 }} others)
                </span>
                <span
                  v-if="
                    developMbships[index].value &&
                    iidx === connectedFarm.groups.length - 1 &&
                    connectedFarm.groups.length - 1 > 2
                  "
                  @click="toggleDevelopMbships(index)"
                  class="nOthers"
                  >reduce</span
                >
              </span>
            </div>
          </td>
        </tr>
        <tr v-if="item.connectedFarms.filter((f) => !f.skip).length == 0">
          <td class="box pa-4">
            <div class="d-flex align-start justify-space-between">
              <span class="d-flex align-center">
                <div class="d-flex flex-column">
                  <span v-if="item.name">
                    <span v-if="item.admin" class="mdi mdi-crown pr-1"></span> {{ item.name }} ({{ item.email }})</span
                  >
                  <div class="d-flex flex-column font-weight-light">
                    <div v-for="(g, gidx) in item.groups" :key="`${item.user}-grp-${gidx}`">{{ g.breadcrumb }}</div>
                  </div>
                </div>
              </span>
              <span v-if="item.name">
                <v-btn text color="green" x-small @click="$emit('connect', item)">+ connect</v-btn>
              </span>
            </div>
          </td>
        </tr>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import { ref, computed } from '@vue/composition-api';
import MyButton from './common/Button.vue';

export default {
  components: { MyButton },
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
  ],
  setup(props) {
    // part Search input field
    const arrHeaderSearch = ref(['', '', '']);
    let headers = computed(() => {
      return [
        {
          text: 'Group Members',
          value: 'groupMembers',
        },
        {
          text: 'Connected Farms',
          value: 'connectedFarms',
        },
        { text: 'Memberships', value: 'memberships' },
      ];
    });

    function filterOnlyCapsText(value, search, item) {
      return Object.values(item).some((v) => v && v.toString().toLowerCase().includes(search.toLowerCase()));
    }

    const filteredMembers = computed(() => {
      let conditions = [];

      if (arrHeaderSearch.value[0] != '') {
        conditions.push(filterGMembers);
      }

      if (arrHeaderSearch.value[1] != '') {
        conditions.push(filterCoFarms);
      }

      if (arrHeaderSearch.value[2] != '') {
        conditions.push(filterMbShips);
      }

      if (conditions.length > 0) {
        return props.groupInfos.members.filter((m) => {
          return conditions.every((condition) => {
            return condition(m);
          });
        });
      }

      return props.groupInfos.members;
    });

    function filterGMembers(item) {
      if (!item.name) {
        return null;
      }
      return item.name.toLowerCase().includes(arrHeaderSearch.value[0].toLowerCase());
    }
    function filterCoFarms(item) {
      let result = false;
      if (item.connectedFarms && item.connectedFarms.length > 0 && item.connectedFarms[0].instanceName) {
        item.connectedFarms.forEach((cF) => {
          result = result || cF.instanceName.toLowerCase().includes(arrHeaderSearch.value[1].toLowerCase());
        });
      }
      return result;
    }
    function filterMbShips(item) {
      let result = false;
      if (item.connectedFarms && item.connectedFarms.length > 0 && item.connectedFarms[0].groups) {
        item.connectedFarms.forEach((cF) => {
          if (cF.groups) {
            cF.groups.forEach((m) => {
              result = result || m.path.toLowerCase().includes(arrHeaderSearch.value[2].toLowerCase());
            });
          }
        });
        return result;
      }
    }

    // part develop + n others

    const developMbships = ref([]);
    for (let i = 0; i < props.groupInfos.members.length; i++) {
      developMbships.value.push(ref(false));
    }
    function toggleDevelopMbships(index) {
      developMbships.value[index].value = !developMbships.value[index].value;
    }

    const selectedPlans = ref(props.groupInfos.planIds);

    return {
      arrHeaderSearch,
      headers,
      filterOnlyCapsText,
      filteredMembers,
      filterGMembers,
      filterCoFarms,
      filterMbShips,
      developMbships,
      toggleDevelopMbships,
      selectedPlans,
    };
  },
};
</script>

<style scoped>
.headerCSS {
  /* top: 0px;
  background-color: white;
  position: sticky;
  font-size: 16px !important;
  border-bottom: none; */
  /* z-index: 10; */
}

.header2CSS {
  /* top: 48px;
  background-color: white;
  position: sticky;
  font-size: 16px;
  border-bottom: none; */
  /* z-index: 10; */
}

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
