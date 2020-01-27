<template>
  <v-container>
    <h1>{{ editMode ? "Edit user" : "Create user" }}</h1>
    <v-form>
      <v-text-field v-model="entity.email" label="E-Mail" />
      <v-text-field v-model="entity.name" label="Name" />
      <v-text-field
        v-model="entity.password"
        label="Password"
        :type="showPasswords ? 'text' : 'password'"
        :hint="passwordHint"
        persistent-hint
      />

      <v-text-field
        v-model="passwordConfirmation"
        label="Password (Confirmation)"
        :type="showPasswords ? 'text' : 'password'"
        :hint="passwordHint"
        persistent-hint
      />
      <div class="d-flex mt-2">
        <v-btn
          class="mr-auto"
          @click="showPasswords = !showPasswords"
        >{{showPasswords ? 'Hide Passwords' : 'Show Passwords'}}</v-btn>
        <v-btn text @click="cancel">Cancel</v-btn>
        <v-btn color="primary" @click="submit">Submit</v-btn>
      </div>
    </v-form>
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
      },
    };
  },
  methods: {
    cancel() {
      this.$router.replace({ name: 'users-list' });
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
        this.$router.push('/users');
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
