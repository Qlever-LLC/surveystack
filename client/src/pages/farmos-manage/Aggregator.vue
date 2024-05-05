<template>
  <a-container>
    <div class="d-flex justify-space-between align-center ma-4">
      <h1>Manage FarmOS Instances</h1>

      <a-progress-circular v-if="loading" class="my-8 align-center mt-6" />
    </div>

    <a-select
      v-if="!loading && !!mappings"
      variant="outlined"
      primary
      label="Select Instance from Aggregator"
      v-model="state.selectedInstance"
      item-title="url"
      item-value="url"
      :items="mappings.aggregatorFarms" />

    <div class="d-flex flex-column mb-5" v-if="!!state.selectedInstance">
      <h3>Notes</h3>
      <a-textarea readonly rows="3" class="pa-1 w-100" v-model="state.selectedInstanceNote" />
    </div>

    <div class="d-flex flex-row mb-5" v-if="!!state.selectedInstance">
      <a-text-field v-model.trim="state.updatedNote" label="Note" hide-details />
      <a-btn color="primary" @click="addSuperAdminNote">update note</a-btn>
    </div>

    <div class="d-flex flex-column mt-2" v-if="!!state.selectedInstance">
      <a-label>Tags for instance on FarmOS Aggregator</a-label>
      <div class="d-flex mt-4">
        <a-chip v-for="(tag, idx) in state.tags" :key="`tag-${idx}`">{{ tag }}</a-chip>
        <a-chip v-if="state.tags.length === 0" color="secondary">No Tags associated with instance</a-chip>
      </div>
    </div>

    <template v-if="!!state.selectedInstance">
      <a-divider class="my-4" />
      <h2 ref="mapGroup">
        Group Mappings for
        <a-chip>{{ state.selectedInstance }}</a-chip>
      </h2>

      <div class="d-flex my-2 align-baseline">
        <a-select
          variant="outlined"
          primary
          label="Map Group to Instance"
          v-model="state.selectedGroup"
          :item-title="(g) => `${g.name} (${g.path})`"
          item-value="_id"
          :items="groups"
          class="mt-4 mr-4" />
        <a-btn
          :disabled="!state.selectedGroup"
          color="primary"
          @click="$emit('map-group', state.selectedGroup, state.selectedInstance)"
          >Map</a-btn
        >
      </div>

      <a-label class="vy-4">Current Group Mappings</a-label>

      <a-table v-if="state.mappedGroups.length > 0">
        <template v-slot:default>
          <thead>
            <tr>
              <th class="text-left">Group Name</th>
              <th class="text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(group, idx) in state.mappedGroups" :key="`grp-${idx}`">
              <td>{{ group.name }}</td>
              <td>
                <a-btn color="red" @click="$emit('unmap-group', group._id, state.selectedInstance)">Unmap</a-btn>
              </td>
            </tr>
          </tbody>
        </template>
      </a-table>
      <a-alert v-else class="mt-4" mode="fade" variant="text" type="warning">
        No Group Mappings exist for {{ state.selectedInstance }}
      </a-alert>

      <a-divider class="my-8" />

      <h2 ref="mapUser">
        User Mappings for
        <a-chip>{{ state.selectedInstance }}</a-chip>
      </h2>

      <div class="d-flex my-2 justify-space-between align-baseline">
        <a-select
          v-if="!loading && !!groups"
          class="mt-4"
          variant="outlined"
          primary
          hint="Select User"
          label="Map User to Instance"
          v-model="state.selectedUser"
          :item-title="(item) => `${item.name} (${item.email})`"
          item-value="_id"
          :items="users" />

        <a-checkbox v-model="state.owner" label="owner" class="mx-6" />

        <a-btn color="primary" @click="$emit('map-user', state.selectedUser, state.selectedInstance, state.owner)"
          >Map</a-btn
        >
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
            <tr v-for="(mapping, idx) in state.mappedUsers" :key="`user-${idx}`">
              <td>{{ `${mapping.user.name} (${mapping.user.email})` }}</td>
              <td>{{ mapping.owner }}</td>
              <td>
                <a-btn color="red" @click="$emit('unmap-user', mapping.userId, mapping.instanceName)">Unmap</a-btn>
              </td>
            </tr>
          </tbody>
        </template>
      </a-table>
    </template>

    <div v-if="state.farmsNotInAggregator.length > 0 && !loading">
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
            <tr v-for="(farm, idx) in state.farmsNotInAggregator" :key="`farm-${idx}`">
              <td>{{ `${farm.instanceName}` }}</td>
              <td>
                <div>
                  <a-chip
                    small
                    class="ma-1"
                    color="blue"
                    v-for="(userMapping, uidx) in farm.userMappings"
                    :key="`farm-${idx}-user-${uidx}`">
                    {{ userMapping.user }}
                  </a-chip>
                </div>

                <div>
                  <a-chip
                    class="ma-1"
                    small
                    color="green"
                    v-for="(groupMapping, gidx) in farm.groupMappings"
                    :key="`farm-${idx}-group-${gidx}`">
                    {{ groupMapping.group }}
                  </a-chip>
                </div>
              </td>
              <td>
                <a-btn x-small color="red" @click="$emit('unmap-farm', farm.instanceName)">Remove all Mappings</a-btn>
              </td>
            </tr>
          </tbody>
        </template>
      </a-table>
    </div>

    <div v-if="state.farmsNotInSurvestack.length > 0 && !loading">
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
            <tr v-for="(farm, idx) in state.farmsNotInSurvestack" :key="`farm-${idx}`">
              <td>{{ `${farm.instanceName}` }}</td>
              <td>
                <div>
                  <a-chip small class="ma-1" v-for="(tag, uidx) in farm.tags" :key="`farm-${idx}-user-${uidx}`">
                    {{ tag }}
                  </a-chip>
                </div>
              </td>
              <td>
                <a-btn x-small color="blue" class="ma-1" @click="mapGroup(farm.instanceName)">Map to Group</a-btn>
              </td>
              <td>
                <a-textarea v-if="farm.note" readonly rows="3" v-model="farm.note" />
              </td>
            </tr>
          </tbody>
        </template>
      </a-table>
    </div>
  </a-container>
</template>

<script setup>
import _ from 'lodash';
import { useGoTo } from 'vuetify';
import { computed, nextTick, reactive, ref } from 'vue';

const goTo = useGoTo();
const mapUserRef = ref(null);
const mapGroupRef = ref(null);

const props = defineProps({
  groups: Array,
  mappings: Object,
  notes: Array,
  loading: Boolean,
  users: Array,
});

const emit = defineEmits(['addSuperAdminNote']);

const state = reactive({
  selectedInstance: null,
  selectedGroup: null,
  selectedUser: null,
  owner: false,
  error: null,
  success: null,
  updatedNote: null,
  selectedInstanceNote: computed(() => {
    let note = null;
    const noteOfFarm = props.notes.find((el) => el.instanceName === state.selectedInstance);
    if (noteOfFarm) {
      note = noteOfFarm.note;
    }
    return note;
  }),
  selectedInstanceInfo: computed(() => {
    return props.mappings.aggregatorFarms.find((e) => e.url === state.selectedInstance);
  }),
  farmsNotInAggregator: computed(() => {
    if (!props.mappings) {
      return [];
    }
    const union = [];
    union.push(...props.mappings.surveystackUserFarms.map((f) => f.instanceName));
    union.push(...props.mappings.surveystackFarms.map((f) => f.instanceName));
    const farms = _.uniq(union).filter(
      (instanceName) => !props.mappings.aggregatorFarms.some((a) => a.url === instanceName)
    );
    const mappings = [];

    for (const farm of farms) {
      const userMappings = props.mappings.surveystackUserFarms
        .filter((f) => f.instanceName === farm)
        .map((m) => ({
          instanceName: m.instanceName,
          user: props.users.find((u) => u._id === m.userId).email,
        }));

      const groupMappings = props.mappings.surveystackFarms
        .filter((f) => f.instanceName === farm)
        .map((group) => ({
          instanceName: group.instanceName,
          group: props.groups.find((g) => g._id === group.groupId).path,
        }));

      mappings.push({
        instanceName: farm,
        userMappings,
        groupMappings,
      });
    }

    return mappings;
  }),
  farmsNotInSurvestack: computed(() => {
    if (!props.mappings) {
      return [];
    }
    const union = [];
    union.push(...props.mappings.surveystackFarms.map((f) => f.instanceName));
    const surveyStackFarms = _.uniq(union);

    // farms without mapping
    const farms = props.mappings.aggregatorFarms.filter((f) => !surveyStackFarms.some((s) => f.url === s));

    const mappings = [];

    for (const farm of farms) {
      let note = null;
      const noteOfFarm = props.notes.find((el) => el.instanceName === farm.url);
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
  }),
  tags: computed(() => {
    if (state?.selectedInstanceInfo.tags == '') {
      return [];
    }
    return state?.selectedInstanceInfo.tags.split(' ');
  }),
  mappedGroups: computed(() => {
    if (!state?.selectedInstance) {
      return [];
    }
    return props.mappings.surveystackFarms
      .filter((farm) => farm.instanceName === state.selectedInstance)
      .map((farm) => {
        return props.groups.find((g) => g._id === farm.groupId);
      });
  }),
  mappedUsers: computed(() => {
    console.log('mappings', props.mappings);
    return props.mappings.surveystackUserFarms
      .filter((farm) => farm.instanceName === state?.selectedInstance)
      .map((farm) => ({
        instanceName: farm.instanceName,
        owner: farm.owner,
        userId: farm.userId,
        user: props.users.find((u) => u._id === farm.userId),
      }));
  }),
});

function mapUser(instanceName) {
  state.selectedInstance = instanceName;
  nextTick(() => {
    goTo(mapUserRef.value);
  });
}
function mapGroup(instanceName) {
  state.selectedInstance = instanceName;
  nextTick(() => {
    goTo(mapGroupRef.value);
  });
}
function addSuperAdminNote() {
  const updatedNote = state.updatedNote;
  const selectedInstance = state.selectedInstance;
  if (updatedNote) {
    emit('addSuperAdminNote', { updatedNote, selectedInstance });
  }
  state.updatedNote = null;
}
</script>
