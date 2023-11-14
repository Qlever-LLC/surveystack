<template>
  <a-container>
    <v-alert v-if="success" class="mt-4" mode="fade" text type="success" @click="success = null">{{ success }}</v-alert>

    <div class="d-flex justify-space-between align-center ma-4">
      <h1>Manage Users</h1>

      <v-progress-circular
        v-if="loading"
        indeterminate
        color="primary"
        class="my-8 align-center mt-6"
      ></v-progress-circular>
    </div>

    <v-autocomplete
      outlined
      primary
      label="Select User"
      v-model="selectedUser"
      v-if="!loading && !!groups"
      :item-text="(item) => `${item.name} (${item.email})`"
      item-value="_id"
      :items="users"
    ></v-autocomplete>

    <v-divider class="my-4"></v-divider>

    <v-simple-table v-if="!loading">
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
              <v-autocomplete
                class="mt-6"
                outlined
                primary
                label="Select FarmOS Instance"
                v-model="selectedInstance"
                v-if="!loading && !!mappings"
                item-value="instanceName"
                item-text="instanceName"
                :items="instances"
              ></v-autocomplete>
            </td>
            <td></td>
            <td>
              <v-checkbox v-model="owner" label="owner"></v-checkbox>
            </td>
            <td>
              <v-btn color="primary" @click="$emit('map-user', selectedUser, selectedInstance, owner)">Map</v-btn>
            </td>
          </tr>

          <tr v-for="(instance, idx) in mappedInstances" :key="`user-${idx}`">
            <td>{{ instance.instanceName }}</td>
            <td>
              <div>
                <v-chip
                  small
                  class="ma-1"
                  dark
                  color="blue"
                  v-for="(userMapping, uidx) in instance.userMappings"
                  :key="`instance-${idx}-user-${uidx}`"
                >
                  {{ userMapping.user }}
                </v-chip>
              </div>

              <div>
                <v-chip
                  class="ma-1"
                  small
                  dark
                  color="green"
                  v-for="(groupMapping, gidx) in instance.groupMappings"
                  :key="`instance-${idx}-group-${gidx}`"
                >
                  {{ groupMapping.group }}
                </v-chip>
              </div>
            </td>
            <td>{{ instance.owner }}</td>
            <td>
              <v-btn color="red" @click="$emit('unmap-user', selectedUser, instance.instanceName)" dark>Unmap</v-btn>
            </td>
          </tr>
        </tbody>
      </template>
    </v-simple-table>
  </a-container>
</template>

<script>
import AContainer from '@/components/ui/AContainer.vue';

export default {
  components: {
    AContainer,
  },
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
