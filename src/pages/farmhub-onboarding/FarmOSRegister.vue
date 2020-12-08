<template>
  <v-flex>
    <v-form
      v-model="valid"
      ref="form"
      class="mt-8"
      @keydown.enter.prevent="submit"
    >

      <v-text-field
        v-model="instance.url"
        label="Instance URL"
        placeholder="Enter Subdomain"
        suffix=".farmos.net"
        :loading="checkingUrl"
        @change="isUrlAvailable"
        outlined
        :rules="urlRules"
      >

        <template v-slot:append-outer>
          <v-icon
            style="margin-top: -8px"
            v-if="!!urlState"
            :color="urlState === 'free' ? 'green' : 'red'"
            large
          > {{ urlState === 'free' ? "mdi-check" : "mdi-alert-octagon" }}</v-icon>
        </template>
      </v-text-field>

      <v-text-field
        v-model="instance.email"
        label="E-Mail Address of Primary User"
        placeholder="Farmer's E-Mail"
        outlined
        :rules="emailRules"
      />

      <v-text-field
        v-model="instance.registrant"
        label="Full Name of the Farmer"
        placeholder="Farmer's Name"
        outlined
        :rules="nameRules"
      />

      <v-text-field
        v-model="instance.site_name"
        label="Name of the Farm"
        placeholder="Farm Name"
        outlined
        :rules="nameRules"
      />

      <v-text-field
        v-model="instance.location"
        label="Farm Address / Location"
        placeholder="123 Fake Street, Exampletown, NY"
        outlined
        :rules="addressRules"
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
        v-model="instance.aggregator.data.planName"
        readonly
        label="Name of Partner Plan to associate the instance with"
        placeholder="Partner Plan"
        disabled
      />

      <v-checkbox
        :rules="agreeRules"
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
        item-value="id"
        item-text="name"
        outlined
        deletable-chips
        chips
        multiple
        return-object
        :loading="loading"
        ref="members"
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
            :to="`/memberships/new?group=${group}&role=user`"
            @click="onInvite"
            target="_blank"
          >
            <v-icon left>mdi-account-plus</v-icon>Invite Member to Organization
          </v-btn>
          <v-divider />
        </template>
        <template v-slot:append-outer>
          <v-btn
            fab
            color="primary"
            style="margin-top: -16px"
            @click="loadMembers"
          >
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </template>
      </v-autocomplete>

      <app-dialog
        labelConfirm="Refresh Members"
        class="primary--text mx-4"
        v-model="invite"
        @cancel="invite = false"
        @confirm="loadMembers"
        width="400"
      >
        To show new members in the dropdown, please press refresh.
      </app-dialog>

      <v-btn
        class="mx-2"
        color="primary"
        :disabled="!valid"
        @click="save"
      >Register FarmOS Instance</v-btn>
    </v-form>

  </v-flex>
</template>

<script>
import api from '@/services/api.service';
import appDialog from '@/components/ui/Dialog.vue';

const nameRule = s => !/[!"#$%()*+,\-./:;<=>?@[\\\]^_{|}~]/gi.test(`${s}`);
const punctFree = s => !/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_‘{|}~]/gi.test(`${s}`);
const xesc = input => (`${input}`).replace(/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_‘{|}~]/gi, '');


const remapGroupMembership = (m) => {
  let username = m.meta.invitationEmail;
  let userExists = false;
  const email = m.meta.invitationEmail;
  if (m.user && m.user.name) {
    username = m.user.name;
    userExists = true;
    // eslint-disable-next-line prefer-destructuring
    // email = m.user.email;
  }
  return {
    id: m._id,
    name: username,
    userExists,
    email,
  };
};


export default {
  props: [
    'instance',
    'group',
  ],
  components: {
    appDialog,
  },
  data() {
    return {
      valid: false,
      activeUsers: [],
      members: [],
      urlState: null,
      checkingUrl: false,
      loading: false,
      invite: false,
      urlRules: [
        () => this.urlState === 'free' || 'URL must be available',
      ],
      emailRules: [
        v => !!v || 'E-mail is required',
        v => /.+@.+\..+/.test(v) || 'E-mail must be valid',
      ],
      nameRules: [
        v => !!v || 'Name Required',
      ],
      addressRules: [
        v => !!v || 'Address Required',
      ],
      agreeRules: [
        v => !!v || 'Must agree to ToS',
      ],
    };
  },
  methods: {
    onInvite() {
      this.invite = true;
    },
    async save() {
      const {
        url,
        email,
        // eslint-disable-next-line camelcase
        site_name,
        registrant,
        location,
        units,
      } = this.instance;

      const { group } = this;
      const aggregator = this.instance.aggregator._id;
      const apiKey = this.instance.aggregator.data.planKey;
      const plan = this.instance.aggregator.data.planName;


      try {
        const r = await api.post('/farmos/create-instance', {
          url,
          email,
          site_name,
          registrant,
          location,
          units,
          plan,
          agree: true,
          apiKey,
          aggregator,
          group,
        });

        if (r.data && r.data.status === 'success') {
          this.$emit('dialog', 'Success', `Sucessfully created ${this.instance.url}. FarmOS Instance is now being created.`);
          this.persistMemberships();
        } else {
          throw new Error('Error creating instance');
        }
      } catch (e) {
        this.$emit('dialog', 'Error', e.message);
      }
    },
    testConnection() {
      this.$emit('testConnection', this.instance);
    },
    async isUrlAvailable() {
      try {
        this.checkingUrl = true;
        const r = await api.post('/farmos/checkurl', {
          plan: this.instance.aggregator.data.planName,
          apiKey: this.instance.aggregator.data.planKey,
          url: this.instance.url,
        });

        if (r.data && r.data.status) {
          console.log('data', r.data);
          if (r.data.status === 'free') {
            this.urlState = 'free';
          } else if (r.data.status === 'taken') {
            this.urlState = 'taken';
          } else {
            this.urlState = null;
            console.log('error', r.data); // TODO show error dialog
          }
        } else {
          throw new Error('Invalid Response Format');
        }
      } catch (error) {
        console.log('error', error);
      }
      this.checkingUrl = false;
      this.$refs.form.validate();
    },
    async loadMembers() {
      this.invite = false;
      this.loading = true;
      this.activeUsers = [];

      try {
        console.log('farmos instance', this.instance);
        const { data } = await api.get(`/groups/${this.group}?populate=true`);
        this.entity = { ...this.entity, ...data };

        const { data: members } = (await api.get(`/memberships?group=${this.group}&populate=true`));
        this.members = members.map(remapGroupMembership);
      } catch (e) {
        console.log('error', e);
        this.$emit('dialog', 'Error', e.message);
      }
      this.loading = false;
    },

    async persistMemberships() {
      const memberships = this.activeUsers.map(a => a.id);
      const data = await api.post('/farmos/set-memberships', {
        group: this.group,
        memberships,
        farmUrl: `${this.instance.url}.farmos.net`,
        farmId: -1,
        aggregator: this.instance.aggregator._id,
      });

      console.log('updated farm', data);
    },
  },
  computed: {
    allow() {
      if (!this.instance.agree) {
        return false;
      }

      if (!this.urlState !== 'free') {
        return false;
      }


      return true;
    },
  },
  watch: {

  },
  async mounted() {
    this.loadMembers();
  },
};
</script>
