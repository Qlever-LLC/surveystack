<template>
  <v-flex>
    <v-form
      class="mt-3"
      @keydown.enter.prevent="submit"
    >

      <v-text-field
        v-model="instance.url"
        readonly
        label="URL"
        placeholder="instance URL"
        outlined
      />

      <v-autocomplete
        label="Members with Access to Farm"
        v-model="activeUsers"
        :items="members"
        item-value="id"
        item-text="name"
        outlined
        deletable-chips
        chips
        multiple
        return-object
      >

        <template v-slot:item="{item}">
          <div v-if="item.userExists">{{ item.name }} <v-chip
              color="grey--darken-2"
              dark
            >{{ item.email }}</v-chip>
          </div>
          <div v-else>
            <v-icon left>mdi-account-clock</v-icon> {{ item.email }}
          </div>
        </template>
        <template v-slot:prepend-item>
          <v-btn
            color="primary"
            class="ma-4"
            outlined
          >
            <v-icon left>mdi-account-plus</v-icon>Invite Member to Organization
          </v-btn>
          <v-divider />
        </template>
      </v-autocomplete>

      <v-btn
        class="mx-2"
        color="primary"
        @click="save"
      >Save Changes</v-btn>
    </v-form>

  </v-flex>
</template>

<script>
import api from '@/services/api.service';

const remapGroupMembership = (m) => {
  console.log('remapGroupMembership', m);
  let username = m.meta.invitationEmail;
  let userExists = false;
  let email = m.meta.invitationEmail;
  if (m.user && m.user.name) {
    username = m.user.name;
    userExists = true;
    // eslint-disable-next-line prefer-destructuring
    email = m.user.email;
  }
  return {
    id: m._id,
    name: username,
    userExists,
    email,
  };
};
const remapFarmOSMembership = (m) => {
  console.log('remapFarmOSMembership', m);
  let username = m.membership.meta.invitationEmail;
  let userExists = false;
  let email = m.membership.meta.invitationEmail;
  if (m.user && m.user.length > 0 && m.user[0].name) {
    username = m.user[0].name;
    userExists = true;
    // eslint-disable-next-line prefer-destructuring
    email = m.user[0].email;
  }
  return {
    id: m.membership._id,
    name: username,
    userExists,
    email,
  };
};


export default {
  props: [
    'instance',
    'group',
    'aggregator',
    'id',
  ],
  data() {
    return {
      activeUsers: [],
      members: [],
    };
  },
  methods: {
    save() {
      this.$emit('save', this.instance);
    },
    testConnection() {
      this.$emit('testConnection', this.instance);
    },
    async load() {
      try {
        console.log('farmos instance', this.instance);
        const { data } = await api.get(`/groups/${this.group}?populate=true`);
        this.entity = { ...this.entity, ...data };

        const { data: members } = (await api.get(`/memberships?group=${this.entity._id}&populate=true`));
        this.members = members.map(remapGroupMembership);

        const { data: authorizedMembers } = await api.get(`/farmos/members-by-farm/?farmUrl=${this.instance.url}&group=${this.group}&aggregator=${this.aggregator}`);
        this.activeUsers = authorizedMembers.map(remapFarmOSMembership);
        console.log('members with access to farm', authorizedMembers);
      } catch (e) {
        console.log('something went wrong:', e);
      }
    },
  },
  mounted() {
    this.load();
  },
  watch: {
    id() {
      this.load();
    },
  },
};
</script>
