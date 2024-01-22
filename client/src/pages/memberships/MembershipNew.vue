<template>
  <a-container>
    <span class="text-secondary overline">{{ state.entity._id }}</span>
    <h2>Invite people to '{{ state.groupDetail.name }}'</h2>
    <a-card class="pa-4 mb-4">
      <a-form ref="form" class="mt-3" @keydown.enter.prevent="submit">
        <a-select
          class="mt-3"
          :items="availableRoles"
          item-title="text"
          item-value="value"
          v-model="state.entity.role"
          label="Role"
          variant="outlined" />

        <a-text-field
          class="mt-3"
          v-model="state.entity.meta.invitationEmail"
          label="Email"
          variant="outlined"
          :rules="state.emailRules"
          validate-on-blur
          hint="Choose an email address you will not lose access to.  Changing an email address later may cause some integrations to not work." />

        <a-text-field
          class="mt-3"
          v-model="state.entity.meta.invitationName"
          variant="outlined"
          hint="Default name for newly registered users"
          labelSlot>
          <template v-slot:label>
            <div>Name <small>(optional)</small></div>
          </template>
        </a-text-field>

        <a-radio-group
          v-model="state.sendEmail"
          name="sendEmail"
          :disabled="state.invitationMethod === INVITATION_METHODS.ADD">
          <a-radio label="Send an invitation email" value="SEND_NOW" labelSlot>
            <template v-slot:label>
              <div>
                <div class="font-weight-medium">Send an invitation email</div>
                <div class="font-weight-regular text-caption">An email invitation will be sent right now</div>
              </div>
            </template>
          </a-radio>
          <a-radio label="Do not send an invitation email at this moment" value="SEND_LATER" labelSlot>
            <template v-slot:label>
              <div>
                <div class="font-weight-medium">Do not send an invitation email now</div>
                <div class="font-weight-regular text-caption">You can send an email invitation later on</div>
              </div>
            </template>
          </a-radio>
        </a-radio-group>

        <div class="d-flex mt-2 justify-end">
          <a-btn variant="text" @click="cancel">Cancel</a-btn>

          <btn-dropdown
            :label="state.invitationMethod === INVITATION_METHODS.INVITE ? 'Invite Member' : 'Add Member'"
            :show-drop-down="true"
            :disabled="!state.submittable"
            :loading="state.isSubmitting"
            @click="submit"
            color="primary"
            elevation="0"
            top
            left>
            <a-list class="pa-0 mx-auto" max-width="280" v-model:selected="state.invitationMethod">
              <a-list-item two-line :value="INVITATION_METHODS.INVITE">
                <a-list-item-title>Invite Member</a-list-item-title>
                <div class="multiline-subtitle">
                  Send them an email to agree to join your group. They only join once they click the "Join" link in the
                  email.
                </div>
              </a-list-item>

              <a-list-item three-line :value="INVITATION_METHODS.ADD">
                <a-list-item-title>Add Member</a-list-item-title>
                <div class="multiline-subtitle">
                  The member joins immediately. An email is still sent informing them they are joined. This is useful
                  when using "Call for Submissions" to send this member survey requests without waiting for them to
                  check their email.
                </div>
              </a-list-item>
            </a-list>
          </btn-dropdown>
        </div>
      </a-form>
    </a-card>

    <a-dialog v-model="state.dialogCreateUser" max-width="500">
      <a-card>
        <a-card-title> User does not exist yet </a-card-title>
        <a-card-text class="mt-4">
          Do you want to proceed to create a new user with email {{ state.entity.meta.invitationEmail }}
        </a-card-text>
        <a-card-actions>
          <a-spacer />
          <a-btn variant="text" @click.stop="state.dialogCreateUser = false"> Cancel </a-btn>
          <a-btn variant="text" color="red" @click.stop="proceedToUserCreation"> Proceed </a-btn>
        </a-card-actions>
      </a-card>
    </a-dialog>
  </a-container>
</template>

<script setup>
import ObjectId from 'bson-objectid';
import api from '@/services/api.service';
import EmailValidator from 'email-validator';

import { uuid } from '@/utils/memberships';
import BtnDropdown from '@/components/ui/BtnDropdown';
import { ref, reactive, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';

const store = useStore();
const router = useRouter();
const route = useRoute();

// LocalStorage key for saving the preferred login method
const LS_MEMBER_INVITATION_METHOD = 'last-used-invitation-method-on-new-member-page';
const INVITATION_METHODS = {
  INVITE: 'invite',
  ADD: 'add',
};

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

const state = reactive({
  entity: {
    _id: '',
    user: null,
    group: null,
    role: 'user',
    meta: {
      status: 'pending',
      dateCreated: new Date().toISOString(),
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
  invitationMethod: Object.values(INVITATION_METHODS).includes(localStorage[LS_MEMBER_INVITATION_METHOD])
    ? [localStorage[LS_MEMBER_INVITATION_METHOD]]
    : [INVITATION_METHODS.INVITE],
  isSubmitting: false,
  emailRules: [(v) => !!v || 'E-mail is required', (v) => EmailValidator.validate(v) || 'E-mail must be valid'],
  submittable: true,
});

const form = ref(null);

function cancel() {
  router.back();
}
function updateCode(code) {
  state.entity.content = code;
}
async function submit() {
  if (!(await form.value.validate())) {
    return;
  }
  const data = state.entity;
  const url =
    state.invitationMethod[0] === INVITATION_METHODS.INVITE
      ? `/memberships?sendEmail=${state.sendEmail}`
      : `/memberships/confirmed`;

  try {
    state.isSubmitting = true;
    await api.post(url, data);
    router.back();
  } catch (err) {
    if (err.response.status === 404) {
      // legacy (no 404 will be thrown from the server)
      state.dialogCreateUser = true;
    }
    await store.dispatch('feedback/add', err.response.data.message);
  } finally {
    state.isSubmitting = false;
  }
}
function proceedToUserCreation() {
  router.replace({
    name: 'users-new',
    query: {
      group: state.entity.group,
      role: state.entity.role,
      email: state.entity.meta.invitationEmail,
    },
  });
}

watch(state.invitationMethod, (newValue) => {
  localStorage[LS_MEMBER_INVITATION_METHOD] = newValue[0];
});

onMounted(async () => {
  state.entity._id = new ObjectId();

  const { group, role } = route.query;
  if (!group || !role) {
    return;
  }

  try {
    const { data: groupDetailData } = await api.get(`/groups/${group}`);
    state.groupDetail = groupDetailData;
    state.entity.group = group;
    state.entity.role = role;
  } catch (e) {
    console.log('something went wrong:', e);
  }
});
</script>

<style scoped lang="scss">
.multiline-subtitle {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6);
  padding: 0;
  line-height: 1.3;
}
</style>
