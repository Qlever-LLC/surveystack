<template>
  <a-dialog
    v-if="state.entity"
    :modelValue="props.modelValue"
    @update:modelValue="closeDialog"
    @click:outside="closeDialog"
    :max-width="mobile ? '100%' : '75%'">
    <a-card color="background">
      <a-card-title class="mt-4 d-flex align-start justify-space-between" style="white-space: pre-wrap">
        <span class="d-flex align-start"
          ><a-icon class="mr-2"> mdi-plus-circle-outline</a-icon>Invite people to '{{ state.groupDetail.name }}'</span
        >
        <a-btn color="background" @click="closeDialog" variant="flat"><a-icon>mdi-close</a-icon></a-btn>
      </a-card-title>
      <a-card-text>
        <a-form ref="form" @keydown.enter.prevent="submit">
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
            :disabled="state.invitationMethod.includes(INVITATION_METHODS.ADD)">
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
            <btn-dropdown
              :label="state.invitationMethod.includes(INVITATION_METHODS.INVITE) ? 'Invite Member' : 'Add Member'"
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
                    Send them an email to agree to join your group. They only join once they click the "Join" link in
                    the email.
                  </div>
                </a-list-item>

                <a-list-item three-line :value="INVITATION_METHODS.ADD">
                  <a-list-item-title>Add Member</a-list-item-title>
                  <div class="multiline-subtitle">
                    The member joins immediately. An email is still sent informing them they are joined. This is useful
                    when using "Call for Responses" to send this member survey requests without waiting for them to
                    check their email.
                  </div>
                </a-list-item>
              </a-list>
            </btn-dropdown>
          </div>
        </a-form>
      </a-card-text>
    </a-card>
  </a-dialog>
</template>

<script setup>
import ObjectId from 'bson-objectid';
import api from '@/services/api.service';
import EmailValidator from 'email-validator';

import { uuid } from '@/utils/memberships';
import BtnDropdown from '@/components/ui/BtnDropdown';
import { ref, reactive, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { useDisplay } from 'vuetify';

const store = useStore();
const route = useRoute();

const { mobile } = useDisplay();

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

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue', 'reload']);

const state = reactive({
  entity: {
    _id: '',
    user: null,
    group: null,
    role: null,
    meta: {
      status: 'pending',
      dateCreated: undefined,
      dateSent: null,
      dateActivated: null,
      notes: '',
      invitationEmail: undefined,
      invitationName: undefined,
      invitationCode: undefined,
    },
  },
  groupDetail: { name: '', path: '' },
  sendEmail: undefined,
  invitationMethod: undefined,
  isSubmitting: false,
  emailRules: [(v) => !!v || 'E-mail is required', (v) => EmailValidator.validate(v) || 'E-mail must be valid'],
  submittable: true,
});

const form = ref(null);

function closeDialog() {
  emit('update:modelValue', false);
}

async function submit() {
  if (!(await form.value.validate())) {
    return;
  }
  const data = state.entity;
  const url = state.invitationMethod.includes(INVITATION_METHODS.INVITE)
    ? `/memberships?sendEmail=${state.sendEmail}`
    : `/memberships/confirmed`;

  try {
    state.isSubmitting = true;
    await api.post(url, data);
    emit('reload');
    closeDialog();
  } catch (err) {
    await store.dispatch('feedback/add', err.response.data.message);
  } finally {
    state.isSubmitting = false;
  }
}

watch(state.invitationMethod, (newValue) => {
  localStorage[LS_MEMBER_INVITATION_METHOD] = newValue[0];
});

watch(
  () => props.modelValue,
  async (val) => {
    state.entity.role = 'user';
    (state.entity.meta.dateCreated = new Date().toISOString()), (state.entity.meta.invitationEmail = null);
    state.entity.meta.invitationName = null;
    state.entity.meta.invitationCode = uuid();
    state.sendEmail = 'SEND_NOW';
    state.invitationMethod = Object.values(INVITATION_METHODS).includes(localStorage[LS_MEMBER_INVITATION_METHOD])
      ? [localStorage[LS_MEMBER_INVITATION_METHOD]]
      : [INVITATION_METHODS.INVITE];

    state.entity._id = new ObjectId();

    const { id } = route.params;
    if (!id) {
      return;
    }

    try {
      const { data: groupDetailData } = await api.get(`/groups/${id}`);
      state.groupDetail = groupDetailData;
      state.entity.group = id;
    } catch (e) {
      console.log('something went wrong:', e);
    }
  }
);
</script>

<style scoped lang="scss">
.multiline-subtitle {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6);
  padding: 0;
  line-height: 1.3;
}
</style>
