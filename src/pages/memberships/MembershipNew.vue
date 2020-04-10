<template>
  <v-container>
    <span class="text--secondary overline">{{entity._id}}</span>
    <h1>Create Membership</h1>

    <v-card class="pa-4 mb-4">
      <v-form
        class="mt-3"
        @keydown.enter.prevent="submit"
      >
        <v-text-field
          v-model="entity.group._id"
          label="Group"
          outlined
          disabled
          :hint="entity.group.name"
          persistent-hint
        />

        <v-text-field
          class="mt-3"
          v-model="entity.user.email"
          label="User"
          outlined
          placeholder="User e-mail"
          persistent-hint
        />

        <v-select
          class="mt-3"
          :items="availableRoles"
          v-model="entity.role"
          label="Role"
          outlined
        ></v-select>

        <div class="d-flex mt-2 justify-end">

          <v-btn
            text
            @click="cancel"
          >Cancel</v-btn>
          <v-btn
            color="primary"
            @click="submit"
            :disabled="!submittable"
          >Submit</v-btn>
        </div>
      </v-form>
    </v-card>

    <v-dialog
      v-model="dialogCreateUser"
      max-width="500"
    >
      <v-card class="">
        <v-card-title>
          User does not exist yet
        </v-card-title>
        <v-card-text class="mt-4">
          Do you want to proceed to create a new user with email {{this.entity.user.email}}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text
            @click.stop="dialogCreateUser = false"
          >
            Cancel
          </v-btn>
          <v-btn
            text
            color="red"
            @click.stop="proceedToUserCreation"
          >
            Proceed
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script>
import ObjectId from 'bson-objectid';
import api from '@/services/api.service';

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

export default {
  data() {
    return {
      availableRoles,
      entity: {
        _id: '',
        user: { _id: '', name: '', email: '' },
        group: { _id: '', name: '', path: '' },
        role: 'user',
      },
      integrations: [],
      dialogCreateUser: false,
    };
  },
  methods: {
    cancel() {
      this.$router.back();
    },
    updateCode(code) {
      this.entity.content = code;
    },
    async submit() {
      const data = {
        _id: this.entity._id, user: this.entity.user.email, group: this.entity.group._id, role: this.entity.role,
      };
      const url = '/memberships';

      try {
        await api.post(url, data);

        this.$router.back();
      } catch (err) {
        if (err.response.status === 404) {
          this.dialogCreateUser = true;
        }
      }
    },
    proceedToUserCreation() {
      this.$router.replace({
        name: 'users-new',
        query: {
          group: this.entity.group._id,
          role: this.entity.role,
          email: this.entity.user.email,
        },
      });
    },
  },
  computed: {
    submittable() {
      if (this.entity.user.email.trim() === '') {
        return false;
      }

      return true;
    },
  },
  async created() {
    this.entity._id = new ObjectId();

    const { group, role } = this.$route.query;
    if (!group || !role) {
      return;
    }

    try {
      const { data: groupEntity } = await api.get(`/groups/${group}`);
      this.entity.group = groupEntity;
    } catch (e) {
      console.log('something went wrong:', e);
    }
  },
};
</script>
