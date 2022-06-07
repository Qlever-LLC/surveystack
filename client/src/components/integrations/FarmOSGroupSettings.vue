<template>
  <div>
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
            <th v-for="(h, i) in headers" :key="'h1' + i" class="headerCSS">
              {{ h.text }}
            </th>
          </tr>
          <tr>
            <th
              v-for="(aHS, i) in arrHeaderSearch"
              :key="i"
              class="header2CSS"
              style="font-size: 16px; border-bottom: none"
            >
              <v-text-field
                v-model="arrHeaderSearch[i]"
                label="Search"
                placeholder="Search"
                filled
                rounded
                dense
                single-line
                append-icon="mdi-magnify"
                class="shrink"
                hide-details
              ></v-text-field>
            </th>
          </tr>
        </thead>
      </template>

      <template v-slot:item="{ item, index }">
        <tr v-for="(group, id) in item.connectedFarms" :key="group.instanceName + '-' + id">
          <td class="box">
            <div v-if="id == 0" class="d-flex align-center justify-space-between">
              <span class="d-flex align-center">
                <span v-if="item.admin" class="mdi mdi-crown pr-1"></span>
                <span v-if="item.name"
                  >{{ item.name }} ({{ item.email }}) <br />
                  {{ item.location }}</span
                >
              </span>
              <span v-if="item.name">
                <my-button little noBorder colorBlue label="+ connect" />
              </span>
            </div>
          </td>
          <td class="box">
            <div v-if="item.connectedFarms[id].instanceName" class="d-flex align-center justify-space-between">
              <span class="d-flex align-center">
                <span v-if="item.connectedFarms[id].owner" class="mdi mdi-crown pr-1"></span>
                <span>{{ item.connectedFarms[id].instanceName }}</span>
              </span>
              <span class="d-flex" style="flex-wrap: nowrap">
                <my-button little noBorder colorBlue label="access" />
                <my-button little noBorder colorRed label="remove" />
              </span>
            </div>
            <div v-else>no farmos connected</div>
          </td>
          <td class="box">
            <div v-if="item.connectedFarms[id].memberships">
              <span v-for="(ms, idd) in item.connectedFarms[id].memberships" :key="idd">
                <span v-if="idd === 0 || idd === 1 || developMbships[index].value">
                  {{ ms.path }}
                  <br />
                </span>
                <span
                  v-if="idd === 2 && !developMbships[index].value"
                  @click="toggleDevelopMbships(index)"
                  class="nOthers"
                >
                  (+{{ item.connectedFarms[id].memberships.length - 2 }} others)
                </span>
                <span
                  v-if="
                    developMbships[index].value &&
                    idd === item.connectedFarms[id].memberships.length - 1 &&
                    item.connectedFarms[id].memberships.length - 1 > 2
                  "
                  @click="toggleDevelopMbships(index)"
                  class="nOthers"
                  >reduce</span
                >
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
    members: {
      type: Array,
      required: true,
    },
  },
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
        return props.members.filter((m) => {
          return conditions.every((condition) => {
            return condition(m);
          });
        });
      }

      return props.members;
    });

    function filterGMembers(item) {
      return item.name?.toLowerCase().includes(arrHeaderSearch.value[0].toLowerCase());
    }
    function filterCoFarms(item) {
      let result = false;
      if (item.connectedFarms[0].instanceName) {
        item.connectedFarms.forEach((cF) => {
          result = result || cF.instanceName.toLowerCase().includes(arrHeaderSearch.value[1].toLowerCase());
        });
      }
      return result;
    }
    function filterMbShips(item) {
      let result = false;
      if (item.connectedFarms[0].memberships) {
        item.connectedFarms.forEach((cF) => {
          if (cF.memberships) {
            cF.memberships.forEach((m) => {
              result = result || m.path.toLowerCase().includes(arrHeaderSearch.value[2].toLowerCase());
            });
          }
        });
        return result;
      }
    }

    // part develop + n others

    const developMbships = ref([]);
    for (let i = 0; i < props.members.length; i++) {
      developMbships.value.push(ref(false));
    }
    function toggleDevelopMbships(index) {
      developMbships.value[index].value = !developMbships.value[index].value;
    }

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
    };
  },
};
</script>

<style scoped>
.headerCSS {
  top: 0px;
  background-color: white;
  position: sticky;
  font-size: 16px !important;
  border-bottom: none;
  z-index: 10;
}
.header2CSS {
  top: 48px;
  background-color: white;
  position: sticky;
  font-size: 16px;
  border-bottom: none;
  z-index: 10;
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
  background-color: rgb(222, 222, 222);
}
.nOthers {
  color: grey;
  cursor: pointer;
}
</style>
