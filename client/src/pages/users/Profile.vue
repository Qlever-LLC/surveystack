<template>
  <v-container class="maxw-40">
    <template v-if="isLoggedIn">
      <app-feedback
        title="Shapeshift:"
        type="info"
        v-if="showFeedback && isShapeshifting"
        @closed="showFeedback = false"
      >
        You are currently shapeshifting...
        <a href="/shapeshift?mode=off" class="text-info" @click.prevent="$store.dispatch('auth/leaveShapeshift')"
          >Click to return as '{{ $store.state.auth.shapeshiftUser.email }}'</a
        >
      </app-feedback>
      <h1>Profile</h1>
      <p class="mt-4 mb-6">
        You are logged in as
        <strong>{{ user.email }}</strong
        >.
      </p>

      <div class="my-4 d-flex align-center">
        <active-group-selector class="flex-grow-1" v-model="activeGroup" outlined tree-view />
        <v-btn class="ml-2" color="error" :disabled="!activeMemebership" @click="isLeaveDialogOpen = true">Leave</v-btn>
      </div>

      <v-dialog v-model="isLeaveDialogOpen" max-width="290">
        <v-card>
          <v-card-title> Leave Group </v-card-title>
          <v-card-text v-if="parentAdminGroup" class="mt-4">
            You are admin of <strong>{{ parentAdminGroup.name }}</strong
            >. To leave this group, you must leave that group or change your status from <strong>Admin</strong> to
            <strong>Member</strong>`
          </v-card-text>
          <v-card-text v-else>
            Are you sure you want to leave
            <strong>{{ activeMemebership ? activeMemebership.group.name : 'the current active group' }}</strong
            >?
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn text @click.stop="isLeaveDialogOpen = false"> {{ parentAdminGroup ? 'Close' : 'Cancel' }} </v-btn>
            <v-btn v-if="!parentAdminGroup" text color="red" @click.stop="leaveGroup"> Leave </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-card outlined>
        <v-card-text> <div>User Details</div></v-card-text>
        <v-card-text>
          <v-form>
            <v-card-text>
              <v-row>
                <div class="text-h6">{{ email }}</div>
                <v-spacer /><v-dialog v-model="isEmailDialogOpen" max-width="500px">
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn small text v-bind="attrs" v-on="on"> Change Email </v-btn>
                  </template>
                  <v-card>
                    <v-card-title class="text-h5"> Change Email </v-card-title>
                    <v-card-text>
                      <v-text-field tabindex="1" v-model="email" label="E-Mail" />
                      Integrations which use your email will no longer work and will need to be updated. These
                      integrations will not work properly until you have re-mapped or updated them. Are you sure?
                    </v-card-text>
                    <v-card-actions>
                      <v-spacer></v-spacer>
                      <v-btn color="primary" text @click="submitEmail" :loading="isSubmittingEmail">
                        Update email
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-dialog></v-row
              ></v-card-text
            >
            <v-text-field tabindex="2" v-model="name" label="Name" />
            <v-text-field
              tabindex="3"
              v-model="password"
              :append-icon="showPasswords ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append="showPasswords = !showPasswords"
              label="Password"
              :type="showPasswords ? 'text' : 'password'"
              hint="Leave blank for no change"
              persistent-hint
            />

            <v-text-field
              tabindex="4"
              v-model="passwordConfirmation"
              :append-icon="showPasswords ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append="showPasswords = !showPasswords"
              label="Password (Confirmation)"
              :type="showPasswords ? 'text' : 'password'"
              hint="Leave blank for no change"
              persistent-hint
            />

            <div class="d-flex mt-2 justify-end">
              <v-btn color="primary" @click="submitData" :loading="isSubmittingData">Save changes</v-btn>
            </div>
          </v-form></v-card-text
        >
      </v-card>
    </template>
    <template v-else>
      <h1>Profile</h1>
      You are not logged in... <router-link to="/auth/login">Go to Login</router-link></template
    >
    <v-alert v-if="status && status.type" class="mt-4 mb-0" mode="fade" text :type="status.type">{{
      status.message
    }}</v-alert>
  </v-container>
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
  },
  created() {
    if (this.user) {
      this.email = this.user.email;
      this.name = this.user.name;
    }
  },
};
</script>
