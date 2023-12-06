<template>
  <a-container class="maxw-40">
    <template v-if="isLoggedIn">
      <app-feedback
        title="Shapeshift:"
        type="info"
        v-if="showFeedback && isShapeshifting"
        @closed="showFeedback = false"
      >
        You are currently shapeshifting...
        <a href="/shapeshift?mode=off" class="text-info" @click.prevent="leaveShapeshift"
          >Click to return as '{{ shapeshiftUser.email }}'</a
        >
      </app-feedback>
      <h1>Profile</h1>
      <p class="mt-4 mb-6">
        You are logged in as
        <strong>{{ user.email }}</strong
        >.
      </p>

      <a-card outlined>
        <a-card-text> <div>User Details</div></a-card-text>
        <a-card-text>
          <a-form>
            <a-card-text>
              <a-row>
                <div class="text-h6">{{ email }}</div>
                <a-spacer />
                <a-dialog v-model="isEmailDialogOpen" max-width="500px">
                  <template v-slot:activator="{ on, attrs }">
                    <a-btn small variant="text" v-bind="attrs" v-on="on"> Change Email </a-btn>
                  </template>
                  <a-card>
                    <a-card-title class="text-h5"> Change Email </a-card-title>
                    <a-card-text>
                      <a-text-field tabindex="1" v-model="email" label="E-Mail" />
                      Integrations which use your email will no longer work and will need to be updated. These
                      integrations will not work properly until you have re-mapped or updated them. Are you sure?
                    </a-card-text>
                    <a-card-actions>
                      <a-spacer />
                      <a-btn color="primary" variant="text" @click="submitEmail" :loading="isSubmittingEmail">
                        Update email
                      </a-btn>
                    </a-card-actions>
                  </a-card>
                </a-dialog>
              </a-row>
            </a-card-text>
            <a-text-field tabindex="2" v-model="name" label="Name" />
            <a-text-field
              tabindex="3"
              v-model="password"
              :append-inner-icon="showPasswords ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append="showPasswords = !showPasswords"
              label="Password"
              :type="showPasswords ? 'text' : 'password'"
              hint="Leave blank for no change"
              persistent-hint
            />

            <a-text-field
              tabindex="4"
              v-model="passwordConfirmation"
              :append-inner-icon="showPasswords ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append="showPasswords = !showPasswords"
              label="Password (Confirmation)"
              :type="showPasswords ? 'text' : 'password'"
              hint="Leave blank for no change"
              persistent-hint
            />

            <div class="d-flex mt-2 justify-end">
              <a-btn color="primary" @click="submitData" :loading="isSubmittingData">Save changes</a-btn>
            </div>
          </a-form>
        </a-card-text>
      </a-card>

      <div class="mt-8 mb-4">
        <h3>Group Memberships</h3>
        <p class="mt-1 mb-5 text-grey text-body-2">These are your group memberships. You can select one to leave.</p>
        <div class="d-flex align-center">
          <active-group-selector class="flex-grow-1" label="Select a group" v-model="activeGroup" outlined tree-view />
          <a-btn class="ml-2" color="error" :disabled="!activeMemebership" @click="isLeaveDialogOpen = true"
            >Leave</a-btn
          >
        </div>
      </div>

      <a-dialog v-model="isLeaveDialogOpen" max-width="290">
        <a-card>
          <a-card-title> Leave Group </a-card-title>
          <a-card-text v-if="parentAdminGroup" class="mt-4">
            To leave <strong>{{ activeGroup.name }}</strong
            >, you must leave <strong>{{ parentAdminGroup.name }}</strong> or change status from
            <strong>Admin</strong> to <strong>Member</strong>
          </a-card-text>
          <a-card-text v-else>
            Are you sure you want to leave
            <strong>{{ activeMemebership ? activeMemebership.group.name : 'the current active group' }}</strong
            >?
          </a-card-text>
          <a-card-actions>
            <a-spacer />
            <a-btn variant="text" @click.stop="isLeaveDialogOpen = false">
              {{ parentAdminGroup ? 'Close' : 'Cancel' }}
            </a-btn>
            <a-btn v-if="!parentAdminGroup" variant="text" color="red" @click.stop="leaveGroup"> Leave </a-btn>
          </a-card-actions>
        </a-card>
      </a-dialog>
    </template>
    <template v-else>
      <h1>Profile</h1>
      You are not logged in... <router-link to="/auth/login">Go to Login</router-link></template
    >
    <a-alert v-if="status && status.type" class="mt-4 mb-0" mode="fade" text :type="status.type">{{
      status.message
    }}</a-alert>
  </a-container>
</template>

<script>
import appFeedback from '@/components/ui/Feedback.vue';
import ActiveGroupSelector from '@/components/shared/ActiveGroupSelector.vue';
import api from '@/services/api.service';
import { pick } from 'lodash';

function findParentAdminGroup(memberships, activeMembership) {
  if (activeMembership.role === 'admin') {
    const parent = memberships.find((membership) => membership.group.path === activeMembership.group.dir);
    if (parent && parent.role === 'admin') {
      return findParentAdminGroup(memberships, parent);
    }
  }
  return activeMembership.group;
}

export default {
  components: {
    appFeedback,
    ActiveGroupSelector,
  },
  data() {
    return {
      showFeedback: true,
      showPasswords: false,
      status: null,
      email: '',
      name: '',
      password: '',
      passwordConfirmation: '',
      isSubmittingData: false,
      isSubmittingEmail: false,
      isEmailDialogOpen: false,
      isLeaveDialogOpen: false,
    };
  },
  computed: {
    isLoggedIn() {
      return this.$store.getters['auth/isLoggedIn'];
    },
    user() {
      return this.$store.getters['auth/user'];
    },
    isShapeshifting() {
      return this.$store.getters['auth/isShapeshifting'];
    },
    activeGroup: {
      get() {
        return this.$store.getters['memberships/activeGroup'];
      },
      set(val) {
        this.$store.dispatch('memberships/setActiveGroup', val);
      },
    },
    activeMemebership() {
      return this.$store.getters['memberships/getMembershipByGroupId'](this.activeGroup);
    },
    parentAdminGroup() {
      const memberships = this.$store.getters['memberships/memberships'];
      if (this.activeMemebership) {
        const parentAdminGroup = findParentAdminGroup(memberships, this.activeMemebership);
        if (parentAdminGroup._id !== this.activeMemebership.group._id) {
          return parentAdminGroup;
        }
      }
      return null;
    },
    shapeshiftUser() {
      return this.$store.state.auth.shapeshiftUser;
    },
  },
  methods: {
    async submitData() {
      this.isSubmittingData = true;
      await this.submit(['name', 'password']);
      this.isSubmittingData = false;
    },
    async submitEmail() {
      this.isSubmittingEmail = true;
      await this.submit(['email']);
      this.isSubmittingEmail = false;
      this.isEmailDialogOpen = false;
    },
    async submit(fields) {
      if (fields.includes('password') && this.password !== this.passwordConfirmation) {
        this.status = { type: 'error', message: 'Passwords do not match' };
        return;
      }

      try {
        this.isSubmitting = true;

        const data = { _id: this.user._id, ...pick(this, fields) };
        const { data: newUser } = await api.customRequest({
          method: 'put',
          url: `/users/${this.user._id}`,
          data,
        });
        await this.readUser();

        if (this.user._id.toString() === newUser.value._id.toString()) {
          this.$store.dispatch('auth/updateToken', newUser.value);
        }

        this.status = {
          type: 'success',
          message: 'Your account details have been saved.',
        };
      } catch (err) {
        console.error(err);
        this.status = { type: 'error', message: err.response.data.message };
      } finally {
        this.isSubmitting = false;
      }
    },
    async leaveGroup() {
      this.isLeaveDialogOpen = false;
      try {
        await api.delete(`/memberships/${this.activeMemebership._id}`);
        this.$store.dispatch('memberships/tryAutoJoinAndSelectGroup');
      } catch (err) {
        this.$store.dispatch('feedback/add', err.response.data.message);
      }
    },
    async readUser() {
      if (this.editMode) {
        try {
          const { id } = this.$route.params;
          const {
            data: { email, name },
          } = await api.get(`/users/${id}`);
          this.email = email;
          this.name = name;
        } catch (e) {
          console.error('Error on loading user:', e);
        }
      }
    },
    leaveShapeshift() {
      this.$store.dispatch('auth/leaveShapeshift');
    },
  },
  created() {
    if (this.user) {
      this.email = this.user.email;
      this.name = this.user.name;
    }
  },
};
</script>
