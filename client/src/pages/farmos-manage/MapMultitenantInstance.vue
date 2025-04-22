<template>
  <a-container>
    <div class="d-flex justify-space-between align-center ma-4">
      <h1>Map Multi-Farm Instance to Group</h1>

      <a-progress-circular v-if="loading" class="my-8 align-center mt-6" />
    </div>

    <a-select
      v-if="!loading && groups"
      variant="outlined"
      primary
      label="Select Group"
      v-model="selectedGroupId"
      :item-title="(g) => `${g.name} (${g.path}) ${g.meta.archived ? '(archived)' : ''}`"
      item-value="_id"
      :items="groups"
    />

    <a-select
      v-if="!loading && mappings"
      class="mt-6"
      variant="outlined"
      primary
      label="Select FarmOS Instance"
      v-model="selectedInstanceName"
      :items="aggregatorFarmInstanceNames"
    />

    <a-btn
      v-if="!loading"
      :disabled="(!selectedGroupId || !selectedInstanceName) || submitLoading"
      color="primary"
      @click="submit()"
    >
      Map Instance to Group
    </a-btn>

    <div v-if="!loading">
      <h2>Multi-Farm Instances</h2>
      <p v-if="!mappings?.multitenantInstances?.length">
        No multi-farm instance mappings exist.
      </p>
      <a-table v-else>
        <template v-slot:default>
          <thead>
            <tr>
              <th class="text-left">Instance Name</th>
              <th class="text-left">Group</th>
              <th class="text-left"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(instance, idx) in mappings.multitenantInstances" :key="`instance-${idx}`">
              <td>{{ `${instance.instanceName}` }}</td>
              <td>
                {{ getGroupNameById(instance.groupId) }}
              </td>
              <td>
                <a-btn
                  color="red"
                  @click="activateUnmapDialog(instance._id)"
                >
                  Unmap
                </a-btn>
              </td>
            </tr>
          </tbody>
        </template>
      </a-table>
    </div>

    <confirm-dialog
      v-model="showUnmapDialog"
      title="Unmap Multi-Farm Instance"
      :error="unmapError"
      message="Unmapping this multi-farm instance will also unmap all users from organizations within the multi-farm instance. Are you sure you want to proceed?"
      button="Unmap"
      button-color="error"
      :loading="unmapIsLoading"
      @confirm="unmap"
      @cleanup="resetUnmapDialog"
    />

  </a-container>
</template>

<script>
import api from '@/services/api.service';
import ConfirmDialog from '../../components/shared/ConfirmDialog.vue';

export default {
  props: ['groups', 'mappings', 'loading'],
  components: {
    ConfirmDialog,
  },
  data() {
    return {
      selectedGroupId: null,
      selectedInstanceName: null,
      submitLoading: false,
      showUnmapDialog: false,
      showUnmapDialogFor: null,
      unmapError: null,
      unmapIsLoading: false,
    };
  },
  computed: {
    aggregatorFarmInstanceNames() {
      return this.mappings.aggregatorFarms
        .filter(f => !this.mappings.multitenantInstances.some(mti => mti.instanceName === f.url))
        .map((f) => f.url)
    }
  },
  methods: {
    submit: async function() {
      try {
        this.submitLoading = true;
        await api.post('/farmos/group-map-instance', {
          group: this.selectedGroupId,
          instanceName: this.selectedInstanceName,
          multiTenant: true,
        });
        this.selectedGroupId = null;
        this.selectedInstanceName = null;
        this.$emit('success');
      } catch (error) {
        console.error('Error mapping multitenant instance:', error);
      } finally {
        this.submitLoading = false;
      }
    },
    activateUnmapDialog: function(id) {
      this.showUnmapDialog = true;
      this.showUnmapDialogFor = id;
    },
    resetUnmapDialog: function() {
      this.showUnmapDialog = false;
      this.showUnmapDialogFor = null;
      this.unmapError = null;
      this.unmapIsLoading = false;
    },
    unmap: async function() {
      try {
        this.unmapIsLoading = true;
        await api.delete(`/farmos/multitenant-instance/${this.showUnmapDialogFor}`);
        this.$emit('success');
      } catch (error) {
        console.error('Error unmapping multitenant instance:', error);
      } finally {
        this.unmapIsLoading = false;
        this.resetUnmapDialog();
      }
    },
    getGroupNameById: function (id) {
      return this.groups.find(g => g._id === id)?.name;
    } 
  }
};
</script>