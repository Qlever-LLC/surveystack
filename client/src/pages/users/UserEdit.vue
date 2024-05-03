<template>
  <a-container>
    <h1>{{ editMode ? 'Edit user' : 'Create user' }}</h1>
    <div v-if="hasMembership && groupEntity" class="subtitle-1">
      ... with role <span class="font-weight-bold">{{ $route.query.role }}</span> @
      <span class="font-weight-bold">{{ groupEntity.name }}</span>
    </div>
    <a-card class="pa-4 mb-4 mt-2">
      <a-card-title v-if="editMode">
        {{ currentEmail }} <a-spacer />
        <a-dialog v-model="isEmailDialogOpen">
          <template v-slot:activator="{ props }">
            <a-btn small variant="text" v-bind="props"> Change Email </a-btn>
          </template>
          <a-card>
            <a-card-title class="text-h5"> Change Email </a-card-title>
            <a-card-text>
              <a-text-field tabindex="1" v-model="entity.email" label="E-Mail" />
              Integrations which use your email will no longer work and will need to be updated. These integrations will
              not work properly until you have re-mapped or updated them. Are you sure?
            </a-card-text>
            <a-card-actions>
              <a-spacer />
              <a-btn color="primary" variant="text" @click="submitEmail" :loading="isSubmittingEmail">
                Update email
              </a-btn>
            </a-card-actions>
          </a-card>
        </a-dialog>
      </a-card-title>
      <a-card-text>
        <a-form>
          <a-text-field v-if="!editMode" tabindex="1" v-model="entity.email" label="E-Mail" />
          <a-text-field tabindex="2" v-model="entity.name" label="Name" />
          <a-text-field
            tabindex="3"
            v-model="entity.password"
            :append-inner-icon="showPasswords ? 'mdi-eye-off' : 'mdi-eye'"
            @click:appendInner="showPasswords = !showPasswords"
            label="Password"
            :type="showPasswords ? 'text' : 'password'"
            :hint="passwordHint"
            persistent-hint />

          <a-text-field
            tabindex="4"
            v-model="passwordConfirmation"
            :append-inner-icon="showPasswords ? 'mdi-eye-off' : 'mdi-eye'"
            @click:appendInner="showPasswords = !showPasswords"
            label="Password (Confirmation)"
            :type="showPasswords ? 'text' : 'password'"
            :hint="passwordHint"
            persistent-hint />

          <a-checkbox v-if="hasMembership" v-model="sendMail" label="[NOT_IMPLEMENTED] Also send a welcome email" />

          <div class="d-flex mt-2 justify-end">
            <a-btn variant="text" @click="cancel">Cancel</a-btn>
            <a-btn color="primary" @click="submitData" :loading="isSubmittingData">Submit</a-btn>
          </div>
        </a-form>
      </a-card-text>
    </a-card>
    <!-- <a-alert v-if="status.type" class="mt-4 mb-0" mode="fade" variant="text" :type="status.type">{{ status.message }}</a-alert> -->
    <transition name="fade">
      <app-feedback v-if="status" class="mt-5" @closed="status = null" :type="status.type">
        {{ status.message }}
      </app-feedback>
    </transition>
  </a-container>
</template>

<script>
import ObjectId from 'bson-objectid';
import api from '@/services/api.service';
import appFeedback from '@/components/ui/Feedback.vue';
import { pick } from 'lodash';

export default {
  components: {
    appFeedback,
  },
  data() {
    return {
      editMode: true,
      passwordConfirmation: '',
      currentEmail: '',
      showPasswords: false,
      status: null,
      entity: {
        _id: '',
        email: '',
        name: '',
        password: '',
      },
      groupEntity: null,
      sendMail: false,
      isSubmittingData: false,
      isSubmittingEmail: false,
      isEmailDialogOpen: false,
    };
  },
  methods: {
    cancel() {
      this.$router.back();
    },
    async submitData() {
      this.isSubmittingData = true;
      if (!this.editMode) {
        await this.submit(['name', 'password', 'email']);
      } else {
        await this.submit(['name', 'password']);
      }

      this.isSubmittingData = false;
    },
    async submitEmail() {
      this.isSubmittingEmail = true;
      await this.submit(['email']);
      this.isSubmittingEmail = false;
      this.isEmailDialogOpen = false;
    },
    async submit(fields) {
      const method = this.editMode ? 'put' : 'post';
      if (!this.editMode) {
        this.entity._id = new ObjectId();
      }

      const url = this.editMode ? `/users/${this.entity._id}` : '/users';

      if (fields.includes('password') && this.entity.password !== this.passwordConfirmation) {
        this.status = { type: 'error', message: 'Passwords do not match' };
        return;
      }

      try {
        const data = pick(this.entity, ['_id', ...fields]);
        const { data: newUser } = await api.customRequest({ method, url, data });
        await this.readUser();

        // also may want to create membership
        if (!this.editMode && this.hasMembership) {
          const { group, role } = this.$route.query;
          const membership = { user: newUser._id, group, role };
          await api.post('/memberships', membership);
        }

        // update the token when we're logged in with the updated user (not superadmin editing a user)
        if (this.editMode && this.user._id.toString() === newUser.value._id.toString()) {
          this.$store.dispatch('auth/updateToken', newUser.value);
        }
        this.status = {
          type: 'success',
          message: this.editMode ? 'Your account details have been saved.' : 'A new user has been created.',
        };
      } catch (err) {
        console.log(err);
        this.status = { type: 'error', message: err.response.data.message };
      }
    },
    async readUser() {
      if (this.editMode) {
        try {
          const { id } = this.$route.params;
          const {
            data: { _id, email, name },
          } = await api.get(`/users/${id}`);
          this.entity = { ...this.entity, _id, email, name };
          this.currentEmail = email;
        } catch (e) {
          console.log('something went wrong:', e);
        }
      }
    },
  },
  computed: {
    passwordHint() {
      if (this.editMode) {
        return 'Leave blank for no change';
      }
      return '';
    },
    hasMembership() {
      const { group, role, email } = this.$route.query;
      return group && role && email;
    },
    user() {
      return this.$store.getters['auth/user'];
    },
  },
  async created() {
    this.editMode = !this.$route.matched.some(({ name }) => name === 'users-new');

    if (this.hasMembership) {
      const { group, email } = this.$route.query;
      this.entity.email = email;

      const { data: groupEntity } = await api.get(`/groups/${group}`);
      this.groupEntity = groupEntity;
    }

    await this.readUser();
  },
};
</script>
