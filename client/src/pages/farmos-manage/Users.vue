<template>
  <a-container>
    <a-alert v-if="success" class="mt-4" mode="fade" variant="text" type="success" @click="success = null">{{
      success
    }}</a-alert>

    <div class="d-flex justify-space-between align-center ma-4">
      <h1>Manage Users</h1>

      <a v-if="loading" indeterminate color="primary" class="my-8 align-center mt-6" />
    </div>

    <a-select
      engineering="autocomplete"
      v-if="!loading && !!groups"
      outlined
      primary
      label="Select User"
      v-model="selectedUser"
      :item-text="(item) => `${item.name} (${item.email})`"
      item-value="_id"
      :items="users"
    />

    <a-divider class="my-4" />

    <a-table v-if="!loading">
      <template v-slot:default>
        <thead>
          <tr>
            <th class="text-left">Instance Name</th>
            <th class="text-left">Mappings</th>
            <th class="text-left">Owner</th>
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
              <a-checkbox v-model="owner" label="owner" />
            </td>
            <td>
              <a-btn color="primary" @click="$emit('map-user', selectedUser, selectedInstance, owner)">Map</a-btn>
            </td>
          </tr>

          <tr v-for="(instance, idx) in mappedInstances" :key="`user-${idx}`">
            <td>{{ instance.instanceName }}</td>
            <td>
              <div>
                <a-chip
                  small
                  class="ma-1"
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
                  color="green"
                  v-for="(groupMapping, gidx) in instance.groupMappings"
                  :key="`instance-${idx}-group-${gidx}`"
                >
                  {{ groupMapping.group }}
                </a-chip>
              </div>
            </td>
            <td>{{ instance.owner }}</td>
            <td>
              <a-btn color="red" @click="$emit('unmap-user', selectedUser, instance.instanceName)">Unmap</a-btn>
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
    mappings: Object,
    loading: Boolean,
    users: Array,
  },
  data() {
    return {
      selectedUser: null,
      selectedInstance: null,
      owner: false,
      error: null,
      success: null,
    };
  },
  computed: {
    mappedInstances() {
      if (!this.selectedUser) {
        return [];
      }

      const farms = this.mappings.surveystackUserFarms
        .filter((farm) => farm.userId === this.selectedUser)
        .map((farm) => ({
          instanceName: farm.instanceName,
          owner: farm.owner,
        }));

      const mappings = [];

      for (const farm of farms) {
        const userMappings = this.mappings.surveystackUserFarms
          .filter((f) => f.instanceName === farm.instanceName)
          .map((m) => ({
            instanceName: m.instanceName,
            user: this.users.find((u) => u._id === m.userId).email,
          }));

        const groupMappings = this.mappings.surveystackFarms
          .filter((f) => f.instanceName === farm.instanceName)
          .map((group) => ({
            instanceName: group.instanceName,
            group: this.groups.find((g) => g._id === group.groupId).path,
          }));

        mappings.push({
          instanceName: farm.instanceName,
          owner: farm.owner,
          userMappings,
          groupMappings,
        });
      }

      return mappings;
    },
    instances() {
      return this.mappings.aggregatorFarms.map((farm) => ({
        instanceName: farm.url,
      }));
    },
  },
};
</script>
