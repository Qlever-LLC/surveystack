<template>
  <v-container>
    <span class="text--secondary overline">{{ entity._id }}</span>
    <h2>Invite people to '{{ groupDetail.name }}'</h2>
    <v-card class="pa-4 mb-4">
      <v-form ref="form" class="mt-3" @keydown.enter.prevent="submit">
        <v-select class="mt-3" :items="availableRoles" v-model="entity.role" label="Role" outlined></v-select>

        <v-text-field
          class="mt-3"
          v-model="entity.meta.invitationEmail"
          label="Email"
          outlined
          :rules="emailRules"
          validate-on-blur
        />

        <v-text-field
          class="mt-3"
          v-model="entity.meta.invitationName"
          outlined
          hint="Default name for newly registered users"
        >
          <template v-slot:label>
            <div>Name <small>(optional)</small></div>
          </template>
        </v-text-field>

        <v-radio-group v-model="sendEmail" name="sendEmail">
          <v-radio label="Send an invitation email" value="SEND_NOW">
            <template v-slot:label>
              <div>
                <div class="font-weight-medium">Send an invitation email</div>
                <div class="font-weight-regular caption">An email invitation will be sent right now</div>
              </div>
            </template>
          </v-radio>
          <v-radio label="Do not send an invitation email at this moment" value="SEND_LATER">
            <template v-slot:label>
              <div>
                <div class="font-weight-medium">Do not send an invitation email now</div>
                <div class="font-weight-regular caption">You can send an email invitation later on</div>
              </div>
            </template>
          </v-radio>
        </v-radio-group>

        <div class="d-flex mt-2 justify-end">
          <v-btn text @click="cancel">Cancel</v-btn>

          <v-btn-toggle :max="0" multiple :value="[]" dense>
            <v-btn :loading="isSubmitting" color="primary" @click="submit" elevation="0" :disabled="!submittable">{{
              invitationMethod === INVITATION_METHODS.INVITE ? 'Invite Member' : 'Add Member'
            }}</v-btn>
            <v-menu top left>
              <template v-slot:activator="{ on, attrs }">
                <v-btn outlined primary v-bind="attrs" v-on="on" color="primary" elevation="0" min-width="0">
                  <v-icon> mdi-chevron-down </v-icon></v-btn
                >
              </template>
              <v-list>
                <v-list-item-group v-model="invitationMethod">
                  <v-list-item two-line :value="INVITATION_METHODS.INVITE">
                    <v-list-item-content>
                      <v-list-item-title>Invite Member</v-list-item-title>
                      <v-list-item-subtitle
                        >Send them an email to agree to join your group. They only join once they click the "Join" link
                        in the email.</v-list-item-subtitle
                      >
                    </v-list-item-content>
                  </v-list-item>

                  <v-list-item three-line :value="INVITATION_METHODS.ADD">
                    <v-list-item-content>
                      <v-list-item-title>Add Member</v-list-item-title>
                      <v-list-item-subtitle style="-webkit-line-clamp: 4">
                        The member joins immediately. An email is still sent informing them they are joined. This is
                        useful when using "Call for Submissions" to send this member survey requests without waiting for
                        them to check their email.
                      </v-list-item-subtitle>
                    </v-list-item-content>
                  </v-list-item>
                </v-list-item-group>
              </v-list>
            </v-menu>
          </v-btn-toggle>
        </div>
      </v-form>
    </v-card>

    <v-dialog v-model="dialogCreateUser" max-width="500">
      <v-card class="">
        <v-card-title> User does not exist yet </v-card-title>
        <v-card-text class="mt-4">
          Do you want to proceed to create a new user with email {{ this.entity.meta.invitationEmail }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click.stop="dialogCreateUser = false"> Cancel </v-btn>
          <v-btn text color="red" @click.stop="proceedToUserCreation"> Proceed </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import ObjectId from 'bson-objectid';
import moment from 'moment';
import api from '@/services/api.service';
import EmailValidator from 'email-validator';

import { uuid } from '@/utils/memberships';

// LocalStorage key for saving the preferred login method
const LS_MEMBER_INVITATION_METHOD = 'last-used-invitation-method-on-new-member-page';

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
  data() {
    const INVITATION_METHODS = {
      INVITE: 'invite',
      ADD: 'add',
    };
    return {
      availableRoles,
      entity: {
        _id: '',
        user: null,
        group: null,
        role: 'user',
        meta: {
          status: 'pending',
          dateCreated: moment().toISOString(),
          dateSent: null,
          dateActivated: null,
          notes: '',
          invitationEmail: null,
          invitationName: null,
          invitationCode: uuid(),
        },
      },
      groupDetail: { name: '', path: '' },
      dialogCreateUser: false,
      sendEmail: 'SEND_NOW',
      INVITATION_METHODS,
      invitationMethod: Object.values(INVITATION_METHODS).includes(localStorage[LS_MEMBER_INVITATION_METHOD])
        ? localStorage[LS_MEMBER_INVITATION_METHOD]
        : INVITATION_METHODS.INVITE,
      isSubmitting: false,
      emailRules: [(v) => !!v || 'E-mail is required', (v) => EmailValidator.validate(v) || 'E-mail must be valid'],
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
      if (!this.$refs.form.validate()) {
        return;
      }
      const data = this.entity;
      const url =
        this.invitationMethod === this.INVITATION_METHODS.INVITE
          ? `/memberships?sendEmail=${this.sendEmail}`
          : `/memberships/confirmed`;

      try {
        this.isSubmitting = true;
        await api.post(url, data);
        this.$router.back();
      } catch (err) {
        if (err.response.status === 404) {
          // legacy (no 404 will be thrown from the server)
          this.dialogCreateUser = true;
        }
        this.$store.dispatch('feedback/add', err.response.data.message);
      } finally {
        this.isSubmitting = false;
      }
    },
    proceedToUserCreation() {
      this.$router.replace({
        name: 'users-new',
        query: {
          group: this.entity.group,
          role: this.entity.role,
          email: this.entity.meta.invitationEmail,
        },
      });
    },
  },
  computed: {
    submittable() {
      return true;
    },
  },
  watch: {
    invitationMethod(newValue) {
      localStorage[LS_MEMBER_INVITATION_METHOD] = newValue;
    },
  },
  async created() {
    this.entity._id = new ObjectId();

    const { group, role } = this.$route.query;
    if (!group || !role) {
      return;
    }

    try {
      const { data: groupDetail } = await api.get(`/groups/${group}`);
      this.groupDetail = groupDetail;
      this.entity.group = group;
      this.entity.role = role;
    } catch (e) {
      console.log('something went wrong:', e);
    }
  },
};
</script>
