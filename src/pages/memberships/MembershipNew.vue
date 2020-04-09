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
          v-model="entity.user._id"
          label="User"
          outlined
          :hint="entity.user.name"
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
          >Submit</v-btn>
        </div>
      </v-form>
    </v-card>

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
        user: { _id: '', name: '' },
        group: { _id: '', name: '', path: '' },
        role: 'user',
      },
      integrations: [],
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
        _id: this.entity._id, user: this.entity.user._id, group: this.entity.group._id, role: this.entity.role,
      };
      const url = '/memberships';

      try {
        await api.post(url, data);

        this.$router.back();
      } catch (err) {
        console.log(err);
      }
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
