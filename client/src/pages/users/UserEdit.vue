<template>
  <v-container>
    <h1>{{ editMode ? 'Edit user' : 'Create user' }}</h1>
    <div v-if="hasMembership && groupEntity" class="subtitle-1">
      ... with role <span class="font-weight-bold">{{ $route.query.role }}</span> @
      <span class="font-weight-bold">{{ groupEntity.name }}</span>
    </div>
    <v-card class="pa-4 mb-4 mt-2">
      <v-card-title v-if="editMode"
        >{{ currentEmail }} <v-spacer /><v-dialog v-model="isEmailDialogOpen">
          <template v-slot:activator="{ on, attrs }">
            <v-btn small text v-bind="attrs" v-on="on"> Change Email </v-btn>
          </template>
          <v-card>
            <v-card-title class="text-h5"> Change Email </v-card-title>
            <v-card-text>
              <v-text-field tabindex="1" v-model="entity.email" label="E-Mail" />
              Integrations which use your email will no longer work and will need to be updated. These integrations will
              not work properly until you have re-mapped or updated them. Are you sure?
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="primary" text @click="submitEmail" :loading="isSubmittingEmail"> Update email </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog></v-card-title
      >
      <v-card-text
        ><v-form>
          <v-text-field v-if="!editMode" tabindex="1" v-model="entity.email" label="E-Mail" />
          <v-text-field tabindex="2" v-model="entity.name" label="Name" />
          <v-text-field
            tabindex="3"
            v-model="entity.password"
            :append-icon="showPasswords ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append="showPasswords = !showPasswords"
            label="Password"
            :type="showPasswords ? 'text' : 'password'"
            :hint="passwordHint"
            persistent-hint
          />

          <v-text-field
            tabindex="4"
            v-model="passwordConfirmation"
            :append-icon="showPasswords ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append="showPasswords = !showPasswords"
            label="Password (Confirmation)"
            :type="showPasswords ? 'text' : 'password'"
            :hint="passwordHint"
            persistent-hint
          />

          <v-checkbox v-if="hasMembership" v-model="sendMail" label="[NOT_IMPLEMENTED] Also send a welcome email" />

          <div class="d-flex mt-2 justify-end">
            <v-btn text @click="cancel">Cancel</v-btn>
            <v-btn color="primary" @click="submitData" :loading="isSubmittingData">Submit</v-btn>
          </div>
        </v-form></v-card-text
      >
    </v-card>
    <!-- <v-alert v-if="status.type" class="mt-4 mb-0" mode="fade" text :type="status.type">{{ status.message }}</v-alert> -->
    <transition name="fade">
      <app-feedback v-if="status" class="mt-5" @closed="status = null" :type="status.type">{{
        status.message
      }}</app-feedback>
    </transition>
  </v-container>
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
      const method = this.editMode ? 'put' : 'post';
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

    this.entity._id = new ObjectId();

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
