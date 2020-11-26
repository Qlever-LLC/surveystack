<template>
  <v-flex>
    <v-form
      class="mt-8"
      @keydown.enter.prevent="submit"
    >

      <v-text-field
        v-model="instance.url"
        label="Instance URL"
        placeholder="Enter Subdomain"
        suffix=".farmos.net"
        outlined
      >

        <template v-slot:append-outer>
          <v-icon
            style="margin-top: -8px"
            v-if="checked"
            color="green"
            large
          >mdi-check</v-icon>
        </template>
      </v-text-field>

      <v-text-field
        v-model="instance.email"
        label="E-Mail Address of Primary User"
        placeholder="Farmer's E-Mail"
        outlined
      />

      <v-text-field
        v-model="instance.registrant"
        label="Full Name of the Farmer"
        placeholder="Farmer's Name"
        outlined
      />

      <v-text-field
        v-model="instance.site_name"
        label="Name of the Farm"
        placeholder="Farm Name"
        outlined
      />


      <v-text-field
        v-model="instance.location"
        label="Farm Address / Location"
        placeholder="123 Fake Street, Exampletown, NY"
        outlined
      />

      <div class="text-left text--secondary">Unit System to use</div>
      <v-radio-group
        v-model="instance.units"
        col
      >

        <v-radio
          label="Metric"
          value="metric"
        ></v-radio>
        <v-radio
          label="US"
          value="us"
        ></v-radio>
      </v-radio-group>

      <v-text-field
        v-model="instance.plan"
        readonly
        label="Name of Partner Plan to associate the instance with"
        placeholder="Partner Plan"
        disabled
      />

      <v-checkbox
        v-model="instance.agree"
        label="Agree to Terms of Service and Privacy Policy of Farmos"
      >
        <template v-slot:label>
        </template>
      </v-checkbox>
      <div class="text-left mb-4">
        Visit
        <a
          href="https://farmier.com/terms"
          target="blank"
        >Terms of Service</a> and <a
          href="https://farmier.com/privacy"
          target="blank"
        >Privacy Policy</a>.
      </div>

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
          <div v-if="item.user">{{ item.user.name }} <v-chip
              color="grey--darken-2"
              dark
            >{{ item.user.email }}</v-chip>
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
        :disabled="!allow"
        @click="save"
      >Register FarmOS Instance</v-btn>
    </v-form>

  </v-flex>
</template>

<script>
import ObjectId from 'bson-objectid';
import api from '@/services/api.service';

export default {
  props: [
    'instance',
    'meta',
  ],
  data() {
    return {
      activeUsers: [],
      members: [],
      checked: false,
      allow: false,
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
  watch: {

  },
  async mounted() {
    try {
      const { groupId: id } = this.meta;
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
