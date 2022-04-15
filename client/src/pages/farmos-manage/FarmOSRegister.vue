<template>
  <v-container>
    <v-form v-model="valid" ref="form" class="mt-8" @keydown.enter.prevent="submit" :disabled="localViewModel.loading">
      <v-autocomplete
        outlined
        primary
        label="Select Group"
        v-model="localViewModel.form.groupId"
        v-if="!!localViewModel.groups"
        item-text="name"
        item-value="_id"
        :items="localViewModel.groups"
        :rules="[(v) => !!v || `select group`]"
      ></v-autocomplete>

      <v-combobox
        outlined
        primary
        label="Select Plan"
        v-model="localViewModel.form.planName"
        :items="localViewModel.plans.map((p) => p.planName)"
        :rules="[(v) => !!v || `select plan`]"
      ></v-combobox>

      <v-row class="align-baseline">
        <v-col>
          <v-text-field
            v-model="localViewModel.form.instanceName"
            label="Instance URL"
            placeholder="Enter Subdomain"
            suffix=".farmos.net"
            :loading="localViewModel.loading"
            outlined
          >
            <template v-slot:append-outer>
              <v-icon
                style="margin-top: -8px"
                v-if="viewModel.form.instanceNameValid === true || viewModel.form.instanceNameValid === false"
                :color="viewModel.form.instanceNameValid === true ? 'green' : 'red'"
                large
                >{{ viewModel.form.instanceNameValid === true ? 'mdi-check' : 'mdi-alert-octagon' }}</v-icon
              >
            </template>
          </v-text-field>
        </v-col>

        <v-col>
          <v-btn @click="$emit('check-url', localViewModel)" color="primary">Check URL</v-btn>
        </v-col>
      </v-row>

      <v-text-field
        v-model="localViewModel.form.email"
        label="E-Mail Address of Primary User"
        placeholder="Farmer's E-Mail"
        outlined
        :rules="emailRules"
      />

      <v-text-field
        v-model="localViewModel.form.fullName"
        label="Full Name of the Farmer"
        placeholder="Farmer's Name"
        outlined
        :rules="nameRules"
      />

      <v-text-field
        v-model="localViewModel.form.farmName"
        label="Name of the Farm"
        placeholder="Farm Name"
        outlined
        :rules="nameRules"
      />

      <v-text-field
        v-model="localViewModel.form.farmAddress"
        label="Farm Address / Location"
        placeholder="123 Fake Street, Exampletown, NY"
        outlined
        :rules="addressRules"
      />

      <v-autocomplete
        label="Timezone"
        outlined
        :items="timezones"
        v-model="localViewModel.form.timezone"
        :rules="[(v) => !!v || `select time zone`]"
        return-object
      />

      <div class="text-left text--secondary">Unit System to use</div>
      <v-radio-group v-model="localViewModel.form.units" col>
        <v-radio label="Metric" value="metric"></v-radio>
        <v-radio label="US" value="us"></v-radio>
      </v-radio-group>

      <v-autocomplete
        label="Owner of the FarmOS Instance"
        outlined
        :items="localViewModel.users"
        item-value="id"
        :item-text="(item) => `${item.name} (${item.email})`"
        v-model="localViewModel.form.owner"
        :rules="[(v) => !!v || `select at least one owner`]"
        return-object
      />

      <!-- <v-autocomplete
        label="Admins with Access to Farm"
        v-model="localViewModel.form.admins"
        :items="localViewModel.users"
        item-value="id"
        :item-text="(item) => `${item.name} (${item.email})`"
        outlined
        deletable-chips
        chips
        multiple
        return-object
        :loading="localViewModel.loading"
        ref="members"
      >
        <template v-slot:item="{ item }">
          <div v-if="item.userExists">
            {{ item.name }}
            <v-chip color="grey--darken-2" dark>{{ item.email }}</v-chip>
          </div>
          <div v-else>
            <v-icon left>mdi-account-clock</v-icon>
            {{ item.email }}
          </div>
        </template>
        <template v-slot:prepend-item>
          <v-btn
            color="primary"
            class="ma-4"
            outlined
            :to="`/memberships/new?group=${selectedGroup}&role=user`"
            @click="onInvite"
            target="_blank"
          >
            <v-icon left>mdi-account-plus</v-icon>Invite Member to Organization
          </v-btn>
          <v-divider />
        </template>
        <template v-slot:append-outer>
          <v-btn fab color="primary" style="margin-top: -16px">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </template>
      </v-autocomplete> -->

      <v-divider class="my-4"></v-divider>

      <app-field-list
        v-if="localViewModel.form.fields.length > 0"
        v-model="localViewModel.form.fields"
      ></app-field-list>

      <v-btn class="mx-2" @click="importFields = true" v-if="!importFields">Add / Import Field</v-btn>

      <app-field-creator
        v-show="importFields"
        :loading="localViewModel.loading"
        ref="field-creator"
        v-model="field"
        @done="fieldImported"
        @cancel="cancelFieldImport"
      ></app-field-creator>

      <v-divider class="my-4"></v-divider>

      <app-dialog
        labelConfirm="Refresh Members"
        class="primary--text mx-4"
        v-model="invite"
        @cancel="invite = false"
        width="400"
        >To show new members in the dropdown, please press refresh.</app-dialog
      >

      <v-checkbox
        :rules="agreeRules"
        v-model="localViewModel.form.agree"
        label="Agree to Terms of Serviceand  Privacy Policy of Farmos"
      >
        <template v-slot:label></template>
      </v-checkbox>
      <div class="text-left mb-4">
        Visit
        <a href="https://farmier.com/terms" target="blank">Terms of Service</a>
        and
        <a href="https://farmier.com/privacy" target="blank">Privacy Policy</a>.
      </div>

      <v-btn class="mx-2" color="primary" :disabled="!valid" @click="save">Register FarmOS Instance</v-btn>
    </v-form>
    <app-dialog
      title="Field Import"
      labelConfirm="OK"
      class="primary--text mx-4"
      v-model="successDialog"
      @cancel="successDialog = false"
      @confirm="successDialog = false"
      width="400"
      >{{ successMessage }}</app-dialog
    >
  </v-container>
</template>

<script>
import _ from 'lodash';

import api from '@/services/api.service';
import appDialog from '@/components/ui/Dialog.vue';
import appFieldCreator from './FieldCreator.vue';
import appFieldList from './FieldList.vue';

import { timezones } from './timezones';

export default {
  props: ['viewModel'],
  components: {
    appDialog,
    appFieldCreator,
    appFieldList,
  },
  data() {
    return {
      localViewModel: _.cloneDeep(this.viewModel),
      field: {
        wkt: '',
        name: '',
      },
      importFields: false,
      successDialog: false,
      successMessage: '',
      valid: false,
      urlState: null,
      invite: false,
      urlRules: [() => this.urlState === 'free' || 'URL must be available'],
      emailRules: [
        (v) => !!v || 'E-mail is required',
        (v) =>
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
            `${v}`
          ) || 'E-mail must be valid (check for leading / trailing white space)',
      ],
      nameRules: [(v) => !!v || 'Name Required'],
      addressRules: [(v) => !!v || 'Address Required'],
      agreeRules: [(v) => !!v || 'Must agree to ToS'],
      timezones: timezones,
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
      this.localViewModel.form.fields.push(this.field);
      this.field = {
        wkt: '',
        name: '',
      };

      this.$refs['field-creator'].clear();
    },
    onInvite() {
      this.invite = true;
    },
    async save() {
      this.$emit('create-instance', this.localViewModel.form, this.localViewModel.form.fields);
    },
    async persistMemberships() {
      // updatge access
    },
  },
  computed: {
    allow() {
      if (!this.localViewModel.form.agree) {
        return false;
      }

      if (!this.urlState !== 'free') {
        return false;
      }

      return true;
    },
  },
  watch: {
    viewModel: {
      deep: true,
      immediate: true,
      handler(vm) {
        console.log('change propagated', vm);
        this.localViewModel = _.cloneDeep(vm);
      },
    },
  },
  async mounted() {},
};
</script>
