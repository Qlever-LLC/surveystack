<template>
  <a-container>
    <div class="d-flex justify-space-between align-center ma-4">
      <h1>Manage FarmOS Instances</h1>

      <a-progress-circular v-if="loading" indeterminate color="primary" class="my-8 align-center mt-6" />
    </div>

    <a-select
      engineering="autocomplete"
      v-if="!loading && !!mappings"
      outlined
      primary
      label="Select Instance from Aggregator"
      v-model="selectedInstance"
      item-text="url"
      item-value="url"
      :items="mappings.aggregatorFarms"
    />

    <div class="d-flex flex-column mb-5" v-if="!!selectedInstance">
      <h3>Notes</h3>
      <textarea
        readonly
        rows="3"
        style="border-style: dotted"
        class="pa-1 w-100"
        v-model="selectedInstanceNote"
      ></textarea>
    </div>

    <div class="d-flex flex-row mb-5" v-if="!!selectedInstance">
      <a-text-field v-model.trim="updatedNote" label="Note" hide-details />
      <a-btn color="primary" @click="addSuperAdminNote">update note</a-btn>
    </div>

    <div class="d-flex flex-column mt-2" v-if="!!selectedInstance">
      <a-label>Tags for instance on FarmOS Aggregator</a-label>
      <div class="d-flex mt-4">
        <a-chip v-for="(tag, idx) in tags" :key="`tag-${idx}`">{{ tag }}</a-chip>
        <a-chip v-if="tags.length === 0" color="secondary">No Tags associated with instance</a-chip>
      </div>
    </div>

    <template v-if="!!selectedInstance">
      <a-divider class="my-4" />
      <h2 ref="map-group">
        Group Mappings for
        <a-chip>{{ selectedInstance }}</a-chip>
      </h2>

      <div class="d-flex my-2 align-baseline">
        <a-select
          engineering="autocomplete"
          outlined
          primary
          label="Map Group to Instance"
          v-model="selectedGroup"
          :item-text="(g) => `${g.name} (${g.path})`"
          item-value="_id"
          :items="groups"
          class="mt-4 mr-4"
        />
        <a-btn :disabled="!selectedGroup" color="primary" @click="$emit('map-group', selectedGroup, selectedInstance)"
          >Map</a-btn
        >
      </div>

      <a-label class="vy-4">Current Group Mappings</a-label>

      <a-table v-if="mappedGroups.length > 0">
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
                <a-btn color="red" @click="$emit('unmap-group', group._id, selectedInstance)" dark>Unmap</a-btn>
              </td>
            </tr>
          </tbody>
        </template>
      </a-table>
      <a-alert v-else class="mt-4" mode="fade" variant="text" type="warning">
        No Group Mappings exist for {{ selectedInstance }}
      </a-alert>

      <a-divider class="my-8" />

      <h2 ref="map-user">
        User Mappings for
        <a-chip>{{ selectedInstance }}</a-chip>
      </h2>

      <div class="d-flex my-2 justify-space-between align-baseline">
        <a-select
          engineering="autocomplete"
          v-if="!loading && !!groups"
          class="mt-4"
          outlined
          primary
          hint="Select User"
          label="Map User to Instance"
          v-model="selectedUser"
          :item-text="(item) => `${item.name} (${item.email})`"
          item-value="_id"
          :items="users"
        />

        <a-checkbox v-model="owner" label="owner" class="mx-6" />

        <a-btn color="primary" @click="$emit('map-user', selectedUser, selectedInstance, owner)">Map</a-btn>
      </div>

      <a-label class="vy-4">Current User Mappings</a-label>
      <a-table v-if="!loading">
        <template v-slot:default>
          <thead>
            <tr>
              <th class="text-left">User</th>
              <th class="text-left">Owner</th>
              <th class="text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(mapping, idx) in mappedUsers" :key="`user-${idx}`">
              <td>{{ `${mapping.user.name} (${mapping.user.email})` }}</td>
              <td>{{ mapping.owner }}</td>
              <td>
                <a-btn color="red" @click="$emit('unmap-user', mapping.userId, mapping.instanceName)" dark>Unmap</a-btn>
              </td>
            </tr>
          </tbody>
        </template>
      </a-table>
    </template>

    <div v-if="farmsNotInAggregator.length > 0 && !loading">
      <h2>Farms in Surveystack which are not present on FarmOS Aggregator</h2>
      <p class="text-grey-darken-2">These instances have likely been removed from the aggregator.</p>
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
            <tr v-for="(farm, idx) in farmsNotInAggregator" :key="`farm-${idx}`">
              <td>{{ `${farm.instanceName}` }}</td>
              <td>
                <div>
                  <a-chip
                    small
                    class="ma-1"
                    color="blue"
                    v-for="(userMapping, uidx) in farm.userMappings"
                    :key="`farm-${idx}-user-${uidx}`"
                  >
                    {{ userMapping.user }}
                  </a-chip>
                </div>

                <div>
                  <a-chip
                    class="ma-1"
                    small
                    color="green"
                    v-for="(groupMapping, gidx) in farm.groupMappings"
                    :key="`farm-${idx}-group-${gidx}`"
                  >
                    {{ groupMapping.group }}
                  </a-chip>
                </div>
              </td>
              <td>
                <a-btn x-small color="red" @click="$emit('unmap-farm', farm.instanceName)" dark
                  >Remove all Mappings</a-btn
                >
              </td>
            </tr>
          </tbody>
        </template>
      </a-table>
    </div>

    <div v-if="farmsNotInSurvestack.length > 0 && !loading">
      <h2>Farms on FarmOS Aggregator which are not mapped to Groups in Surveystack</h2>
      <p class="text-grey-darken-2">
        These instances are likely self hosted or have not been added to a payment plan of a group.
      </p>
      <a-table v-if="!loading">
        <template v-slot:default>
          <thead>
            <tr>
              <th class="text-left">Instance Name</th>
              <th class="text-left">Tags</th>
              <th class="text-left">Action</th>
              <th class="text-left">Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(farm, idx) in farmsNotInSurvestack" :key="`farm-${idx}`">
              <td>{{ `${farm.instanceName}` }}</td>
              <td>
                <div>
                  <a-chip small class="ma-1" v-for="(tag, uidx) in farm.tags" :key="`farm-${idx}-user-${uidx}`">
                    {{ tag }}
                  </a-chip>
                </div>
              </td>
              <td>
                <a-btn x-small color="blue" class="ma-1" @click="mapGroup(farm.instanceName)" dark>Map to Group</a-btn>
              </td>
              <td>
                <textarea v-if="farm.note" readonly rows="3" v-model="farm.note"></textarea>
              </td>
            </tr>
          </tbody>
        </template>
      </a-table>
    </div>
  </a-container>
</template>

<script>
import _ from 'lodash';

export default {
  emits: ['addSuperAdminNote'],
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
      updatedNote: null,
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
    addSuperAdminNote() {
      const updatedNote = this.updatedNote;
      const selectedInstance = this.selectedInstance;
      if (updatedNote) {
        this.$emit('addSuperAdminNote', { updatedNote, selectedInstance });
      }
      this.updatedNote = null;
    },
  },
  computed: {
    selectedInstanceNote() {
      let note = null;
      const noteOfFarm = this.notes.find((el) => el.instanceName === this.selectedInstance);
      if (noteOfFarm) {
        note = noteOfFarm.note;
      }
      return note;
    },
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
        let note = null;
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
