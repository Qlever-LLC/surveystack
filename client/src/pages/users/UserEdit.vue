<template>
  <v-container>
    <h1>{{ editMode ? 'Edit user' : 'Create user' }}</h1>
    <div v-if="hasMembership && groupEntity" class="subtitle-1">
      ... with role <span class="font-weight-bold">{{ $route.query.role }}</span> @
      <span class="font-weight-bold">{{ groupEntity.name }}</span>
    </div>
    <v-card class="pa-4 mb-4 mt-2">
      <v-form>
        <v-text-field v-model="entity.email" label="E-Mail" />
        <v-text-field v-model="entity.name" label="Name" />
        <v-text-field
          v-model="entity.password"
          :append-icon="showPasswords ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append="showPasswords = !showPasswords"
          label="Password"
          :type="showPasswords ? 'text' : 'password'"
          :hint="passwordHint"
          persistent-hint
        />

        <v-text-field
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
          <v-btn color="primary" @click="submit">Submit</v-btn>
        </div>
      </v-form>
    </v-card>
    <transition name="fade">
      <app-feedback v-if="status" class="mt-5" @closed="status = ''">{{ status }}</app-feedback>
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
      status: '',
      entity: {
        _id: '',
        email: '',
        name: '',
        password: '',
      },
      groupEntity: null,
      sendMail: false,
    };
  },
  methods: {
    cancel() {
      this.$router.back();
    },
    async submit() {
      const data = this.entity;
      const method = this.editMode ? 'put' : 'post';
      const url = this.editMode ? `/users/${this.entity._id}` : '/users';

      if (this.entity.password !== this.passwordConfirmation) {
        this.status = 'Passwords do not match';
        return;
      }

      try {
        const { data: newUser } = await api.customRequest({
          method,
          url,
          data,
        });

        // also may want to create membership
        if (!this.editMode && this.hasMembership) {
          const { group, role } = this.$route.query;
          const membership = { user: newUser._id, group, role };
          await api.post('/memberships', membership);
        }
        this.$router.back();
      } catch (err) {
        console.log(err);
        this.status = err.response.data.message;
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
        const { data } = await api.get(`/users/${id}`);
        this.entity = { ...this.entity, ...data };
      } catch (e) {
        console.log('something went wrong:', e);
      }
    }
  },
};
</script>
