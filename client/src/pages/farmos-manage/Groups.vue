<template>
  <v-container>
    <v-alert v-if="success" class="mt-4" mode="fade" text type="success" @click="success = null">{{ success }}</v-alert>

    <div class="d-flex justify-space-between align-center ma-4">
      <h1>Manage Groups</h1>

      <v-progress-circular
        v-if="loading"
        indeterminate
        color="primary"
        class="my-8 align-center mt-6"
      ></v-progress-circular>
    </div>

    <a-select
      engineering="autocomplete"
      v-if="!loading && !!groups"
      outlined
      primary
      label="Select Group"
      v-model="selectedGroup"
      :item-text="(g) => `${g.name} (${g.path})`"
      item-value="_id"
      :items="groups"
    />

    <!-- <v-row class="align-baseline">
      <v-col>
        <a-select
          engineering="autocomplete"
          v-if="!loading && !!groups"
          outlined
          primary
          label="Select Group Plan"
          v-model="selectedPlan"
          :items="plans"
        />
      </v-col>
      <v-col>
        <v-btn color="primary" @click="$emit('save-plan', selectedPlan)">Save Plan</v-btn>
      </v-col>
    </v-row> -->

    <div v-if="!loading && !!selectedGroup" class="px-3">{{ amountMappedInstances }}</div>

    <a-divider class="my-4" />

    <v-simple-table v-if="!loading">
      <template v-slot:default>
        <thead>
          <tr>
            <th class="text-left">Instance Name</th>
            <th class="text-left">Mappings</th>
            <th class="text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <a-select
                engineering="autocomplete"
                v-if="!loading && !!mappings"
                class="mt-6"
                outlined
                primary
                label="Select FarmOS Instance"
                v-model="selectedInstance"
                item-value="instanceName"
                item-text="instanceName"
                :items="instances"
              />
            </td>
            <td></td>
            <td>
              <v-btn color="primary" @click="$emit('map-group', selectedGroup, selectedInstance)">Map</v-btn>
            </td>
          </tr>

          <tr v-for="(instance, idx) in mappedInstances" :key="`grp-${idx}`">
            <td>{{ instance.instanceName }}</td>
            <td>
              <div>
                <a-chip
                  small
                  class="ma-1"
                  dark
                  color="blue"
                  v-for="(userMapping, uidx) in instance.userMappings"
                  :key="`instance-${idx}-user-${uidx}`"
                >
                  {{ userMapping.user }}
                </a-chip>
              </div>

              <div>
                <a-chip
                  class="ma-1"
                  small
                  dark
                  color="green"
                  v-for="(groupMapping, gidx) in instance.groupMappings"
                  :key="`instance-${idx}-group-${gidx}`"
                >
                  {{ groupMapping.group }}
                </a-chip>
              </div>
            </td>
            <td>
              <v-btn color="red" @click="$emit('unmap-group', selectedGroup, instance.instanceName)" dark>Unmap</v-btn>
            </td>
          </tr>
        </tbody>
      </template>
    </v-simple-table>
  </v-container>
</template>

<script>
import ASelect from '@/components/ui/ASelect.vue';
export default {
  components: {
    ASelect,
  },
  props: {
    groups: Array,
    users: Array,
    plans: Array,
    mappings: Object,
    loading: Boolean,
  },
  data() {
    return {
      selectedGroup: null,
      selectedInstance: null,
      selectedPlan: null,
      error: null,
      success: null,
    };
  },
  watch: {
    selectedGroup() {
      console.log('group updated', this.selectedGroup);
    },
  },
  computed: {
    mappedInstances() {
      if (!this.selectedGroup) {
        return [];
      }

      const farms = this.mappings.surveystackFarms
        .filter((farm) => farm.groupId === this.selectedGroup)
        .map((farm) => farm.instanceName);

      const mappings = [];

      for (const farm of farms) {
        const userMappings = this.mappings.surveystackUserFarms
          .filter((f) => f.instanceName === farm)
          .map((m) => ({
            instanceName: m.instanceName,
            user: this.users.find((u) => u._id === m.userId).email,
          }));

        const groupMappings = this.mappings.surveystackFarms
          .filter((f) => f.instanceName === farm)
          .map((group) => ({
            instanceName: group.instanceName,
            group: this.groups.find((g) => g._id === group.groupId).path,
          }));

        mappings.push({
          instanceName: farm,
          userMappings,
          groupMappings,
        });
      }

      return mappings;
    },
    amountMappedInstances() {
      if (this.mappedInstances.length === 0) {
        return `0 Instance`;
      } else if (this.mappedInstances.length === 1) {
        return `1 Instance`;
      } else {
        return `${this.mappedInstances.length} Instances`;
      }
    },
    instances() {
      return this.mappings.aggregatorFarms.map((farm) => ({
        instanceName: farm.url,
      }));
    },
  },
};
</script>
