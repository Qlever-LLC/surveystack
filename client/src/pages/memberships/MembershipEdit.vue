<template>
  <v-container>
    <span class="text--secondary overline">{{ entity._id }}</span>
    <h1>Edit Membership</h1>

    <v-card class="pa-4 mb-4">
      <div class="d-flex">
        <v-btn class="ml-auto" color="error" outlined @click="dialogRemoval = true">
          <v-icon left>mdi-trash-can-outline</v-icon> Delete
        </v-btn>
      </div>
      <v-form class="mt-3" @keydown.enter.prevent="submit">
        <v-select :items="availableStatus" v-model="entity.meta.status" label="Status" disabled />

        <v-text-field v-model="entity.group" label="Group" disabled />

        <v-text-field v-if="entity.user" class="mt-3" v-model="entity.user" label="User" disabled />

        <v-text-field class="mt-3" v-model="entity.meta.invitationEmail" label="Invitation Email" disabled />

        <v-text-field
          v-if="entity.meta.status === 'pending'"
          class="mt-3"
          v-model="entity.meta.invitationName"
          label="Invitee Name"
          hint="Default name for newly registered users"
        />

        <v-select class="mt-3" :items="availableRoles" v-model="entity.role" label="Role"></v-select>

        <div class="d-flex mt-2">
          <v-btn class="ml-auto" text @click="cancel">Cancel</v-btn>
          <v-btn color="primary" @click="submit">Save</v-btn>
        </div>
      </v-form>
    </v-card>

    <v-card class="my-3 pa-2" v-if="resendEnabled">
      <v-card-title> <v-icon left>mdi-account-clock</v-icon>Pending </v-card-title>
      <v-card-subtitle>Membership has not been claimed</v-card-subtitle>
      <v-card-text>
        You can try to resend the invitation via email. You may also view the secret invitation link and deliver it by
        other means.
      </v-card-text>
      <v-card-actions class="d-flex justify-space-between align-center">
        <div>
          <v-btn color="primary" @click="resend"> <v-icon left>mdi-email-send-outline</v-icon> Resend </v-btn>
          <span class="ml-1 caption text--secondary">{{
            entity.meta.dateSent ? `sent ${entity.meta.dateSent}` : 'Not yet sent'
          }}</span>
        </div>
        <div>
          <v-btn @click="dialogInvitationLink = true" color="primary">
            <v-icon left>mdi-eye-outline</v-icon>View
          </v-btn>
        </div>
      </v-card-actions>
    </v-card>

    <v-dialog v-model="dialogRemoval" max-width="290">
      <v-card class="">
        <v-card-title> Delete Membership </v-card-title>
        <v-card-text class="mt-4"> Are you sure you want to delete this membership? </v-card-text>
        <v-card-actions>
          <a-spacer />
          <v-btn text @click.stop="dialogRemoval = false"> Cancel </v-btn>
          <v-btn text color="red" @click.stop="remove"> Delete </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogSent" max-width="400">
      <v-card class="">
        <v-card-title> Sent </v-card-title>
        <v-card-text class="mt-4">
          An invitation email has been sent to<br />{{ entity.meta.invitationEmail }}
        </v-card-text>
        <v-card-actions>
          <a-spacer />
          <v-btn text @click.stop="dialogSent = false"> OK </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <app-dialog
      v-model="dialogInvitationLink"
      title="Invitation Link"
      @cancel="dialogInvitationLink = false"
      @confirm="dialogInvitationLink = false"
    >
      <p>
        Copy the following secret invitation link. It can be used to claim this membership - either by creating a new
        user account, or by using an already existing user account.
      </p>

      <span class="body-1">{{ invitationLink }}</span>
    </app-dialog>
  </v-container>
</template>

<script>
import api from '@/services/api.service';
import appDialog from '@/components/ui/Dialog.vue';
import ASpacer from '@/components/ui/ASpacer.vue';

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
    ASpacer,
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
