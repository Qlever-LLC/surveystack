<template>
  <v-container>
    <h1>{{ editMode ? "Edit user" : "Create user" }}</h1>
    <v-card class="pa-4 mb-4">

      <v-form>
        <v-text-field
          v-model="entity.email"
          label="E-Mail"
        />
        <v-text-field
          v-model="entity.name"
          label="Name"
        />
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
        <div class="d-flex mt-2 justify-end">

          <v-btn
            text
            @click="cancel"
          >Cancel</v-btn>
          <v-btn
            color="primary"
            @click="submit"
          >Submit</v-btn>
        </div>
      </v-form>
    </v-card>
  </v-container>
</template>

<script>
import ObjectId from 'bson-objectid';
import api from '@/services/api.service';

export default {
  data() {
    return {
      editMode: true,
      passwordConfirmation: '',
      showPasswords: false,
      entity: {
        _id: '',
        email: '',
        name: '',
        password: '',
        memberships: [],
      },
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
        this.$store.dispatch('feedback/add', 'Passwords do not match');
        return;
      }

      try {
        await api.customRequest({
          method,
          url,
          data,
        });
        this.$router.back();
      } catch (err) {
        console.log(err);
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
  },
  async created() {
    this.editMode = !this.$route.matched.some(
      ({ name }) => name === 'users-new',
    );

    this.entity._id = new ObjectId();
    const { group, role } = this.$route.query;
    if (group && role) {
      this.entity.memberships.push({ group, role });
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
