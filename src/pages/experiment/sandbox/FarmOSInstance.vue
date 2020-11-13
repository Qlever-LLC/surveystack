<template>
  <v-flex>
    <v-form
      class="mt-3"
      @keydown.enter.prevent="submit"
    >
      <v-text-field
        v-model="instance.name"
        label="Name"
        placeholder="Name"
        outlined
      />

      <v-text-field
        v-model="instance.url"
        label="URL"
        placeholder="instance URL"
        outlined
      />

      <v-autocomplete
        label="Members with Access to Farm"
        v-model="activeUsers"
        :items="members"
        item-value="_id"
        item-text="text"
        outlined
        deletable-chips
        chips
        multiple
        return-object
      >

        <template v-slot:item="{item}">
          <div v-if="item.user">{{ item.user.name }} <v-chip color="grey--darken-2" dark>{{ item.user.email }}</v-chip>
          </div>
          <div v-else>
            <v-icon left>mdi-account-clock</v-icon> {{ item.meta.invitationEmail }}
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
import ObjectId from 'bson-objectid';
import api from '@/services/api.service';

export default {
  props: [
    'instance',
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
  },
  async mounted() {
    try {
      const { groupId: id } = this.instance;
      const { data } = await api.get(`/groups/${id}?populate=true`);
      this.entity = { ...this.entity, ...data };

      const { data: members } = (await api.get(`/memberships?group=${this.entity._id}&populate=true`));
      members.forEach((m) => {
        // eslint-disable-next-line no-param-reassign
        m.text = m.user ? m.user.name : m.meta.invitationEmail;
      });

      this.members = members;

      const { data: integrations } = await api.get(`/group-integrations?group=${id}`);
      this.integrations = integrations;
      console.log('members', members);
    } catch (e) {
      console.log('something went wrong:', e);
    }
  },
};
</script>
