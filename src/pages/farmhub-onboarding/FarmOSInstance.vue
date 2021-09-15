<template>
  <v-flex>
    <v-form class="mt-3" @keydown.enter.prevent="submit">
      <v-text-field v-model="instance.url" readonly label="URL" placeholder="instance URL" outlined />

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
        <template v-slot:item="{ item }">
          <div v-if="item.userExists">
            {{ item.name }}
            <v-chip color="grey--darken-2" dark>{{ item.email }}</v-chip>
          </div>
          <div v-else><v-icon left>mdi-account-clock</v-icon> {{ item.email }}</div>
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
          <v-btn fab color="primary" style="margin-top: -16px" @click="load">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </template>
      </v-autocomplete>

      <v-divider class="my-4"></v-divider>
      <div class="text-h5">Create new Field</div>

      <app-field-creator
        :loading="loading"
        ref="field-creator"
        :center="farmLocation"
        v-model="field"
        @done="fieldImported"
        @cancel="cancelFieldImport"
      ></app-field-creator>

      <app-dialog
        labelConfirm="Refresh Members"
        class="primary--text mx-4"
        v-model="invite"
        @cancel="invite = false"
        @confirm="load"
        width="400"
      >
        To show new members in the dropdown, please press refresh.
      </app-dialog>

      <v-divider class="my-8"></v-divider>
      <v-btn class="mx-2" color="primary" @click="save">Save Changes</v-btn>
    </v-form>
    <app-dialog
      title="Field Import"
      labelConfirm="OK"
      class="primary--text mx-4"
      v-model="successDialog"
      @cancel="successDialog = false"
      @confirm="successDialog = false"
      width="400"
    >
      {{ successMessage }}
    </app-dialog>
  </v-flex>
</template>

<script>
import api from '@/services/api.service';
import appDialog from '@/components/ui/Dialog.vue';
import appFieldCreator from './FieldCreator.vue';

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
const remapFarmOSMembership = (m) => {
  let username = m.membership.meta.invitationEmail;
  let userExists = false;
  const email = m.membership.meta.invitationEmail;
  if (m.user && m.user.length > 0 && m.user[0].name) {
    username = m.user[0].name;
    userExists = true;
    // eslint-disable-next-line prefer-destructuring
    // email = m.user[0].email;
  }
  return {
    id: m.membership._id,
    name: username,
    userExists,
    email,
  };
};

export default {
  components: {
    appDialog,
    appFieldCreator,
  },
  props: ['instance', 'group', 'aggregator', 'id'],
  data() {
    return {
      successDialog: false,
      successMessage: '',
      activeUsers: [],
      members: [],
      loading: false,
      invite: false,
      kml: '',
      farmLocation: null,
      field: {
        wkt: '',
        name: '',
      },
    };
  },
  methods: {
    cancelFieldImport() {
      this.field = {
        wkt: '',
        name: '',
      };

      this.$refs['field-creator'].clear();
    },
    async fieldImported() {
      this.loading = true;
      console.log('imported field', this.field);
      try {
        const { data } = await api.post(`/farmos/areas/${this.aggregator}/${this.instance.url}`, this.field);
        console.log('reponse', data);
        this.successDialog = true;
        if (data.status === 'success') {
          this.successMessage = `Successfully created field: ${this.field.name} on ${this.instance.url}`;
        } else {
          this.successMessage = `Error creating field: ${this.field.name} on ${this.instance.url}, ${data.message}`;
        }
      } catch (error) {
        this.successDialog = true;
        this.successMessage = `Error creating field: ${this.field.name} on ${this.instance.url}, ${error.message}`;
      }

      this.field = {
        wkt: '',
        name: '',
      };

      this.$refs['field-creator'].clear();
      this.loading = false;
    },
    onInvite() {
      this.invite = true;
    },
    save() {
      try {
        this.persistMemberships();
        this.$emit('dialog', 'Success', 'Saved changes');
      } catch (error) {
        this.$emit('dialog', 'Error', `Unable to save changes: ${error.message}`);
      }
    },
    testConnection() {
      this.$emit('testConnection', this.instance);
    },
    async persistMemberships() {
      const memberships = this.activeUsers.map((a) => a.id);
      const data = await api.post('/farmos/set-memberships', {
        group: this.group,
        memberships,
        farmUrl: this.instance.url,
        farmId: this.instance.id,
        aggregator: this.aggregator,
      });

      console.log('updated farm', data);
    },
    async load() {
      this.invite = false;
      this.loading = true;
      this.activeUsers = [];

      this.field = {
        wkt: '',
        name: '',
      };

      this.$refs['field-creator'].clear();

      try {
        console.log('farmos instance', this.instance);
        const { data } = await api.get(`/groups/${this.group}?populate=true`);
        this.entity = { ...this.entity, ...data };

        const { data: members } = await api.get(`/memberships?group=${this.entity._id}&populate=true`);
        this.members = members.map(remapGroupMembership);

        const { data: authorizedMembers } = await api.get(
          `/farmos/members-by-farm/?farmUrl=${this.instance.url}&group=${this.group}&aggregator=${this.aggregator}`
        );
        this.activeUsers = authorizedMembers.map(remapFarmOSMembership);
        console.log('members with access to farm', authorizedMembers);
      } catch (e) {
        console.log('something went wrong:', e);
      }

      try {
        const { data } = await api.get(`/farmos/areas/${this.aggregator}/${this.instance.url}`);
        if (!data.status === 'success') {
          throw new Error(`request failed: ${data.message}`);
        }

        const areas = data.areas[Object.keys(data.areas)[0]];
        console.log('areas', areas);
        this.farmLocation = areas.find((a) => a.area_type === 'property').geofield[0].geom;
      } catch (error) {
        console.log('error', error);
      }
      this.loading = false;
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
