<template>
  <v-container>
    <span class="text--secondary overline">{{entity._id}}</span>
    <h2>Invite Members to {{groupDetail.name}}</h2>
    <h4 class="text--secondary">{{groupDetail.path}}</h4>
    <v-card class="pa-4 mb-4">
      <v-form
        class="mt-3"
        @keydown.enter.prevent="submit"
      >

        <v-select
          class="mt-3"
          :items="availableRoles"
          v-model="entity.role"
          label="Role"
          outlined
        ></v-select>

        <v-text-field
          class="mt-3"
          v-model="entity.meta.sentTo"
          label="Email"
          outlined
        />

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
          Do you want to proceed to create a new user with email {{this.entity.meta.sentTo}}
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
import moment from 'moment';
import api from '@/services/api.service';

import { uuid } from '@/utils/memberships';

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
        user: null,
        group: null,
        role: 'user',
        meta: {
          status: 'pending',
          dateCreated: moment().toISOString(),
          dateClaimed: null,
          sentTo: null,
          notes: '',
          invitation: uuid(),
        },
      },
      groupDetail: { name: '', path: '' },
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
      const data = this.entity;
      const url = '/memberships';

      try {
        await api.post(url, data);

        this.$router.back();
      } catch (err) {
        if (err.response.status === 404) {
          this.dialogCreateUser = true;
        }
        this.$store.dispatch('feedback/add', err.response.data.message);
      }
    },
    proceedToUserCreation() {
      this.$router.replace({
        name: 'users-new',
        query: {
          group: this.entity.group,
          role: this.entity.role,
          email: this.entity.meta.sentTo,
        },
      });
    },
  },
  computed: {
    submittable() {
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
      const { data: groupDetail } = await api.get(`/groups/${group}`);
      this.groupDetail = groupDetail;
      this.entity.group = group;
      this.entity.role = role;
    } catch (e) {
      console.log('something went wrong:', e);
    }
  },
};
</script>
