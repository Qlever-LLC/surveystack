<template>
  <v-container>
    <span class="text--secondary overline">{{entity._id}}</span>
    <h1>Edit Membership</h1>

    <v-card class="pa-4 mb-4">
      <v-form
        class="mt-3"
        @keydown.enter.prevent="submit"
      >
        <v-text-field
          v-model="entity.group"
          label="Group"
          outlined
          disabled
          :hint="entity.group"
          persistent-hint
        />

        <v-text-field
          class="mt-3"
          v-model="entity.user"
          label="User"
          outlined
          disabled
          :hint="entity.user"
          persistent-hint
        />

        <v-select
          class="mt-3"
          :items="availableRoles"
          v-model="entity.role"
          label="Role"
          outlined
        ></v-select>

        <div class="d-flex mt-2">
          <v-btn
            class="mr-auto"
            text
            color="error"
            @click="dialogRemoval = true"
          >Delete</v-btn>

          <v-btn
            text
            @click="cancel"
          >Cancel</v-btn>
          <v-btn
            color="primary"
            @click="submit"
          >Submit</v-btn>
        </div>
      </v-form>
    </v-card>

    <v-card>
      <app-integration-list
        title="Membership Integrations"
        :entities="integrations"
        :newRoute="{name: 'membership-integrations-new', query: {membership: entity._id}}"
        integrationType="membership"
      />
    </v-card>

    <v-dialog
      v-model="dialogRemoval"
      max-width="290"
    >
      <v-card class="">
        <v-card-title>
          Delete Membership
        </v-card-title>
        <v-card-text class="mt-4">
          Are you sure you want to delete this membership?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text
            @click.stop="dialogRemoval = false"
          >
            Cancel
          </v-btn>
          <v-btn
            text
            color="red"
            @click.stop="remove"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import api from '@/services/api.service';
import appIntegrationList from '@/components/integrations/IntegrationList.vue';

const availableRoles = [
  {
    value: 'user',
    text: 'User',
  },
  {
    value: 'admin',
    text: 'Admin',
  },
];

export default {
  components: {
    appIntegrationList,
  },
  data() {
    return {
      availableRoles,
      entity: {
        _id: '',
        user: null,
        group: null,
        role: 'user',
        meta: {},
      },
      groupDetail: null,
      integrations: [],
      dialogRemoval: false,
    };
  },
  methods: {
    cancel() {
      this.$router.back();
    },
    updateCode(code) {
      this.entity.content = code;
    },
    async submit() {
      const data = this.entity;
      const url = `/memberships/${this.entity._id}`;

      try {
        await api.put(url, data);

        this.$router.back();
      } catch (err) {
        console.log('err', err);
      }
    },
    async remove() {
      this.dialogRemoval = false;
      try {
        await api.delete(`/memberships/${this.entity._id}`);
        this.$router.back();
      } catch (err) {
        console.log('MembershipEdit remove error', err);
      }
    },
  },

  async created() {
    try {
      const { id } = this.$route.params;
      const { data: entity } = await api.get(`/memberships/${id}`);
      this.entity = { ...this.entity, ...entity };

      const { data: groupDetail } = await api.get(`/groups/${this.entity.group}`);
      this.groupDetail = groupDetail;

      const { data: integrations } = await api.get(`/membership-integrations?membership=${id}`);
      this.integrations = integrations;
    } catch (e) {
      console.log('something went wrong:', e);
    }
  },
};
</script>
