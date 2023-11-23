<template>
  <a-container>
    <a-alert v-if="success" class="mt-4" mode="fade" text type="success" @click="success = null">{{ success }}</a-alert>

    <div class="d-flex justify-space-between align-center ma-4">
      <h1>Manage Groups</h1>

      <a-progress-circular v-if="loading" indeterminate color="primary" class="my-8 align-center mt-6" />
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

    <!-- <a-row class="align-baseline">
      <a-col>
        <a-select
          engineering="autocomplete"
          v-if="!loading && !!groups"
          outlined
          primary
          label="Select Group Plan"
          v-model="selectedPlan"
          :items="plans"
        />
      </a-col>
      <a-col>
        <a-btn color="primary" @click="$emit('save-plan', selectedPlan)">Save Plan</a-btn>
      </a-col>
    </a-row> -->

    <div v-if="!loading && !!selectedGroup" class="px-3">{{ amountMappedInstances }}</div>

    <a-divider class="my-4" />

    <a-table v-if="!loading">
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
              <a-btn color="primary" @click="$emit('map-group', selectedGroup, selectedInstance)">Map</a-btn>
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
              <a-btn color="red" @click="$emit('unmap-group', selectedGroup, instance.instanceName)" dark>Unmap</a-btn>
            </td>
          </tr>
        </tbody>
      </template>
    </a-table>
  </a-container>
</template>

<script>
export default {
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
