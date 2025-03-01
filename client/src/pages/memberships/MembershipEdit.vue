<template>
  <a-container class="bg-background rounded mt-5">
    <span class="text-secondary overline">{{ entity._id }}</span>
    <h1>Edit Membership</h1>

    <a-card class="pa-4 mb-4">
      <div class="d-flex">
        <a-btn class="ml-auto" color="error" variant="outlined" @click="dialogRemoval = true">
          <a-icon left>mdi-trash-can-outline</a-icon> Delete
        </a-btn>
      </div>
      <a-form class="mt-3" @keydown.enter.prevent="submit">
        <a-select
          :items="availableStatus"
          item-title="text"
          item-value="value"
          v-model="entity.meta.status"
          label="Status"
          disabled />

        <a-text-field v-model="entity.group" label="Group" disabled />

        <a-text-field v-if="entity.user" class="mt-3" v-model="entity.user" label="User" disabled />

        <a-text-field class="mt-3" v-model="entity.meta.invitationEmail" label="Invitation Email" disabled />

        <a-text-field
          v-if="entity.meta.status === 'pending'"
          class="mt-3"
          v-model="entity.meta.invitationName"
          label="Invitee Name"
          hint="Default name for newly registered users" />

        <a-select
          class="mt-3"
          :items="availableRoles"
          item-title="text"
          item-value="value"
          v-model="entity.role"
          label="Role" />

        <div class="d-flex mt-2">
          <a-btn class="ml-auto" variant="text" @click="cancel">Cancel</a-btn>
          <a-btn color="primary" @click="submit">Save</a-btn>
        </div>
      </a-form>
    </a-card>

    <a-card class="my-3 pa-2" v-if="resendEnabled">
      <a-card-title> <a-icon left>mdi-account-clock</a-icon>Pending </a-card-title>
      <a-card-subtitle>Membership has not been claimed</a-card-subtitle>
      <a-card-text>
        You can try to resend the invitation via email. You may also view the secret invitation link and deliver it by
        other means.
      </a-card-text>
      <a-card-actions class="d-flex justify-space-between align-center">
        <div>
          <a-btn color="primary" @click="resend"> <a-icon left>mdi-email-send-outline</a-icon> Resend </a-btn>
          <span class="ml-1 text-caption text-secondary">{{
            entity.meta.dateSent ? `sent ${entity.meta.dateSent}` : 'Not yet sent'
          }}</span>
        </div>
        <div>
          <a-btn @click="dialogInvitationLink = true" color="primary">
            <a-icon left>mdi-eye-outline</a-icon>View
          </a-btn>
        </div>
      </a-card-actions>
    </a-card>

    <a-dialog v-model="dialogRemoval" max-width="290">
      <a-card>
        <a-card-title> Delete Membership </a-card-title>
        <a-card-text class="mt-4"> Are you sure you want to delete this membership? </a-card-text>
        <a-card-actions>
          <a-spacer />
          <a-btn variant="text" @click.stop="dialogRemoval = false"> Cancel </a-btn>
          <a-btn variant="text" color="red" @click.stop="remove"> Delete </a-btn>
        </a-card-actions>
      </a-card>
    </a-dialog>

    <a-dialog v-model="dialogSent" max-width="400">
      <a-card>
        <a-card-title> Sent </a-card-title>
        <a-card-text class="mt-4">
          An invitation email has been sent to<br />{{ entity.meta.invitationEmail }}
        </a-card-text>
        <a-card-actions>
          <a-spacer />
          <a-btn variant="text" @click.stop="dialogSent = false"> OK </a-btn>
        </a-card-actions>
      </a-card>
    </a-dialog>

    <app-dialog
      v-model="dialogInvitationLink"
      title="Invitation Link"
      @cancel="dialogInvitationLink = false"
      @confirm="dialogInvitationLink = false">
      <p>
        Copy the following secret invitation link. It can be used to claim this membership - either by creating a new
        user account, or by using an already existing user account.
      </p>

      <span class="body-1">{{ invitationLink }}</span>
    </app-dialog>
  </a-container>
</template>

<script>
import api from '@/services/api.service';
import appDialog from '@/components/ui/Dialog.vue';

const availableRoles = [
  {
    value: 'user',
    text: 'Member',
  },
  {
    value: 'admin',
    text: 'Admin',
  },
];

const availableStatus = [
  {
    value: 'pending',
    text: 'Pending',
  },
  {
    value: 'active',
    text: 'Active',
  },
];

export default {
  components: {
    appDialog,
  },
  data() {
    return {
      availableRoles,
      availableStatus,
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
      dialogSent: false,
      initialInvitationEmail: null,
      dialogInvitationLink: false,
    };
  },
  watch: {
    'entity.meta.invitationEmail': function (newVal, oldVal) {
      if (!oldVal) {
        this.initialInvitationEmail = newVal;
      }
    },
  },
  computed: {
    resendEnabled() {
      if (this.entity.meta.status === 'pending' && this.initialInvitationEmail === this.entity.meta.invitationEmail) {
        return true;
      }
      return false;
    },
    invitationLink() {
      return `${window.location.origin}/invitations?code=${this.entity.meta.invitationCode}`;
    },
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
        this.$store.dispatch('feedback/add', err.response.data.message);
      }
    },
    async remove() {
      this.dialogRemoval = false;
      try {
        await api.delete(`/memberships/${this.entity._id}`);
        this.$router.back();
      } catch (err) {
        this.$store.dispatch('feedback/add', err.response.data.message);
      }
    },
    async resend() {
      this.dialogSent = false;
      try {
        const { data: updated } = await api.post(`/memberships/${this.entity._id}/resend`);
        console.log(updated);
        this.entity = updated;
        this.dialogSent = true;
      } catch (err) {
        this.$store.dispatch('feedback/add', err.response.data.message);
      }
    },
  },

  async created() {
    try {
      const { membershipId } = this.$route.params;
      const { data: entity } = await api.get(`/memberships/${membershipId}`);
      this.entity = { ...this.entity, ...entity };

      const { data: groupDetail } = await api.get(`/groups/${this.entity.group}`);
      this.groupDetail = groupDetail;

      const { data: integrations } = await api.get(`/membership-integrations?membership=${membershipId}`);
      this.integrations = integrations;
    } catch (e) {
      console.log('something went wrong:', e);
    }
  },
};
</script>
