<template>
  <v-container>
    <h1>{{ editMode ? 'Edit user' : 'Create user' }}</h1>
    <div v-if="hasMembership && groupEntity" class="subtitle-1">
      ... with role <span class="font-weight-bold">{{ $route.query.role }}</span> @
      <span class="font-weight-bold">{{ groupEntity.name }}</span>
    </div>
    <v-card class="pa-4 mb-4 mt-2">
      <v-form>
        <v-text-field tabindex="1" v-model="entity.email" label="E-Mail" :readonly="editMode" />
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
          <v-btn color="primary" @click="submit" :loading="isSubmitting">Submit</v-btn>
        </div>
      </v-form>
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

export default {
  components: {
    appFeedback,
  },
  data() {
    return {
      editMode: true,
      passwordConfirmation: '',
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
      isSubmitting: false,
    };
  },
  methods: {
    cancel() {
      this.$router.back();
    },
    async submit() {
      const method = this.editMode ? 'put' : 'post';
      const url = this.editMode ? `/users/${this.entity._id}` : '/users';

      if (this.entity.password !== this.passwordConfirmation) {
        this.status = { type: 'error', message: 'Passwords do not match' };
        return;
      }

      try {
        this.isSubmitting = true;

        const { _id, email, name, password } = this.entity;
        const { data: newUser } = await api.customRequest({
          method,
          url,
          data: { _id, email, name, password },
        });

        // also may want to create membership
        if (!this.editMode && this.hasMembership) {
          const { group, role } = this.$route.query;
          const membership = { user: newUser._id, group, role };
          await api.post('/memberships', membership);
        }
        if (this.editMode) {
          this.$store.dispatch('auth/updateToken', newUser.value);
        }
        this.status = {
          type: 'success',
          message: this.editMode ? 'Your account details have been saved.' : 'A new user has been created.',
        };
      } catch (err) {
        console.log(err);
        this.status = { type: 'error', message: err.response.data.message };
      } finally {
        this.isSubmitting = false;
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

    if (this.editMode) {
      try {
        const { id } = this.$route.params;
        const {
          data: { _id, email, name },
        } = await api.get(`/users/${id}`);
        this.entity = { ...this.entity, _id, email, name };
      } catch (e) {
        console.log('something went wrong:', e);
      }
    }
  },
};
</script>
