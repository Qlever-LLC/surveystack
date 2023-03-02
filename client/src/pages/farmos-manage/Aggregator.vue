<template>
  <v-container>
    <div class="d-flex justify-space-between align-center ma-4">
      <h1>Manage FarmOS Instances</h1>

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
      label="Select Instance from Aggregator"
      v-model="selectedInstance"
      v-if="!loading && !!mappings"
      item-text="url"
      item-value="url"
      :items="mappings.aggregatorFarms"
    ></v-autocomplete>

    <div class="d-flex flex-column mt-2" v-if="!!selectedInstance">
      <v-label>Tags for instance on FarmOS Aggregator</v-label>
      <div class="d-flex mt-4">
        <v-chip v-for="(tag, idx) in tags" :key="`tag-${idx}`" green>{{ tag }}</v-chip>
        <v-chip v-if="tags.length === 0" color="secondary">No Tags associated with instance</v-chip>
      </div>
    </div>

    <template v-if="!!selectedInstance">
      <v-divider class="my-4"></v-divider>
      <h2 ref="map-group">
        Group Mappings for
        <v-chip>{{ selectedInstance }}</v-chip>
      </h2>

      <div class="v-flex my-2">
        <v-autocomplete
          outlined
          primary
          label="Select Group"
          v-model="selectedGroup"
          :item-text="(g) => `${g.name} (${g.path})`"
          item-value="_id"
          :items="groups"
        ></v-autocomplete>
        <v-btn :disabled="!selectedGroup" color="primary" @click="$emit('map-group', selectedGroup, selectedInstance)"
          >Map Selected Aggregator Instance to Group in Surveystack</v-btn
        >
      </div>

      <v-label class="vy-4">Current Group Mappings</v-label>

      <v-simple-table v-if="mappedGroups.length > 0">
        <template v-slot:default>
          <thead>
            <tr>
              <th class="text-left">Group Name</th>
              <th class="text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(group, idx) in mappedGroups" :key="`grp-${idx}`">
              <td>{{ group.name }}</td>
              <td>
                <v-btn color="red" @click="$emit('unmap-group', group._id, selectedInstance)" dark>Unmap</v-btn>
              </td>
            </tr>
          </tbody>
        </template>
      </v-simple-table>
      <v-alert v-else class="mt-4" mode="fade" text type="warning"
        >No Group Mappings exist for {{ selectedInstance }}</v-alert
      >

      <v-divider class="my-8"></v-divider>

      <h2 ref="map-user">
        User Mappings for
        <v-chip>{{ selectedInstance }}</v-chip>
      </h2>
      <v-simple-table v-if="!loading">
        <template v-slot:default>
          <thead>
            <tr>
              <th class="text-left">Instance Name</th>
              <th class="text-left">Owner</th>
              <th class="text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(mapping, idx) in mappedUsers" :key="`user-${idx}`">
              <td>{{ `${mapping.user.name} (${mapping.user.email})` }}</td>
              <td>{{ mapping.owner }}</td>
              <td>
                <v-btn color="red" @click="$emit('unmap-user', mapping.userId, mapping.instanceName)" dark>Unmap</v-btn>
              </td>
            </tr>

            <tr>
              <td>
                <v-autocomplete
                  class="mt-4"
                  outlined
                  primary
                  hint="Select User"
                  label="Map User to Instance"
                  v-model="selectedUser"
                  v-if="!loading && !!groups"
                  :item-text="(item) => `${item.name} (${item.email})`"
                  item-value="_id"
                  :items="users"
                ></v-autocomplete>
              </td>
              <td>
                <v-checkbox v-model="owner" label="owner"></v-checkbox>
              </td>
              <td>
                <v-btn color="primary" @click="$emit('map-user', selectedUser, selectedInstance, owner)">Map</v-btn>
              </td>
            </tr>
          </tbody>
        </template>
      </v-simple-table>
    </template>

    <div v-if="farmsNotInAggregator.length > 0 && !loading">
      <h2>Farms in Surveystack which are not present on FarmOS Aggregator</h2>
      <p class="grey--text text--darken-2">These instances have likely been removed from the aggregator.</p>
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
            <tr v-for="(farm, idx) in farmsNotInAggregator" :key="`farm-${idx}`">
              <td>{{ `${farm.instanceName}` }}</td>
              <td>
                <div>
                  <v-chip
                    small
                    class="ma-1"
                    dark
                    color="blue"
                    v-for="(userMapping, uidx) in farm.userMappings"
                    :key="`farm-${idx}-user-${uidx}`"
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
                    v-for="(groupMapping, gidx) in farm.groupMappings"
                    :key="`farm-${idx}-group-${gidx}`"
                  >
                    {{ groupMapping.group }}
                  </v-chip>
                </div>
              </td>
              <td>
                <v-btn x-small color="red" @click="$emit('unmap-farm', farm.instanceName)" dark
                  >Remove all Mappings</v-btn
                >
              </td>
            </tr>
          </tbody>
        </template>
      </v-simple-table>
    </div>

    <div v-if="farmsNotInSurvestack.length > 0 && !loading">
      <h2>Farms on FarmOS Aggregator which are not mapped to Groups in Surveystack</h2>
      <p class="grey--text text--darken-2">
        These instances are likely self hosted or have not been added to a payment plan of a group.
      </p>
      <v-simple-table v-if="!loading">
        <template v-slot:default>
          <thead>
            <tr>
              <th class="text-left">Instance Name</th>
              <th class="text-left">Tags</th>
              <th class="text-left">Notes</th>
              <th class="text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(farm, idx) in farmsNotInSurvestack" :key="`farm-${idx}`">
              <td>{{ `${farm.instanceName}` }}</td>
              <td>
                <div>
                  <v-chip small class="ma-1" dark v-for="(tag, uidx) in farm.tags" :key="`farm-${idx}-user-${uidx}`">
                    {{ tag }}
                  </v-chip>
                </div>
              </td>
              <td v-if="farm.note">
                {{ `${farm.note}` }}
              </td>
              <td v-else></td>
              <td>
                <v-btn x-small color="blue" class="ma-1" @click="mapGroup(farm.instanceName)" dark>Map to Group</v-btn>
              </td>
            </tr>
          </tbody>
        </template>
      </v-simple-table>
    </div>
  </v-container>
</template>

<script>
import _ from 'lodash';

export default {
  props: {
    groups: Array,
    mappings: Object,
    notes: Array,
    loading: Boolean,
    users: Array,
  },
  data() {
    return {
      selectedInstance: null,
      selectedGroup: null,
      selectedUser: null,
      owner: false,
      error: null,
      success: null,
    };
  },
  methods: {
    mapUser(instanceName) {
      this.selectedInstance = instanceName;
      this.$nextTick(() => {
        this.$vuetify.goTo(this.$refs['map-user']);
      });
    },
    mapGroup(instanceName) {
      this.selectedInstance = instanceName;
      this.$nextTick(() => {
        this.$vuetify.goTo(this.$refs['map-group']);
      });
    },
  },
  computed: {
    selectedInstanceInfo() {
      return this.mappings.aggregatorFarms.find((e) => e.url === this.selectedInstance);
    },
    farmsNotInAggregator() {
      if (!this.mappings) {
        return [];
      }
      const union = [];
      union.push(...this.mappings.surveystackUserFarms.map((f) => f.instanceName));
      union.push(...this.mappings.surveystackFarms.map((f) => f.instanceName));
      const farms = _.uniq(union).filter(
        (instanceName) => !this.mappings.aggregatorFarms.some((a) => a.url === instanceName)
      );
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
    farmsNotInSurvestack() {
      if (!this.mappings) {
        return [];
      }
      const union = [];
      union.push(...this.mappings.surveystackFarms.map((f) => f.instanceName));
      const surveyStackFarms = _.uniq(union);

      // farms without mapping
      const farms = this.mappings.aggregatorFarms.filter((f) => !surveyStackFarms.some((s) => f.url === s));

      const mappings = [];

      for (const farm of farms) {
        let note = undefined;
        const noteOfFarm = this.notes.find((el) => el.instanceName === farm.url);
        if (noteOfFarm) {
          note = noteOfFarm.note;
        }
        mappings.push({
          instanceName: farm.url,
          tags: farm.tags.split(' '),
          note: note,
        });
      }

      return mappings;
    },
    tags() {
      if (this.selectedInstanceInfo.tags == '') {
        return [];
      }
      return this.selectedInstanceInfo.tags.split(' ');
    },
    mappedGroups() {
      if (!this.selectedInstance) {
        return [];
      }
      return this.mappings.surveystackFarms
        .filter((farm) => farm.instanceName === this.selectedInstance)
        .map((farm) => {
          return this.groups.find((g) => g._id === farm.groupId);
        });
    },
    mappedUsers() {
      console.log('mappings', this.mappings);
      return this.mappings.surveystackUserFarms
        .filter((farm) => farm.instanceName === this.selectedInstance)
        .map((farm) => ({
          instanceName: farm.instanceName,
          owner: farm.owner,
          userId: farm.userId,
          user: this.users.find((u) => u._id === farm.userId),
        }));
    },
  },
};
</script>
