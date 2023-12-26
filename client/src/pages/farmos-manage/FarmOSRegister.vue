<template>
  <a-container>
    <a-form v-model="valid" ref="form" class="mt-8" @keydown.enter.prevent="submit" :disabled="localViewModel.loading">
      <a-select
        v-if="!!localViewModel.groups"
        variant="outlined"
        primary
        label="Select Group"
        v-model="localViewModel.form.groupId"
        :item-title="(g) => `${g.name} (${g.path})`"
        item-value="_id"
        :items="localViewModel.groups"
        :rules="[(v) => !!v || `select group`]"
      />

      <a-select
        variant="outlined"
        primary
        label="Select Plan"
        v-model="localViewModel.form.plan"
        :items="localViewModel.plans"
        :item-title="(p) => `${p.planName}, ${p.planUrl}`"
        item-value="_id"
        :rules="[(v) => !!v || `select plan`]"
      />

      <a-row class="align-baseline">
        <a-col>
          <a-text-field
            :disabled="!localViewModel.form.plan"
            v-model.trim="localViewModel.form.instanceName"
            label="Instance URL"
            placeholder="Enter Subdomain"
            :suffix="'.' + planUrl"
            :loading="localViewModel.loading"
            variant="outlined"
            appendSlot
          >
            <template v-slot:append>
              <a-icon
                style="margin-top: -8px"
                v-if="viewModel.form.instanceNameValid === true || viewModel.form.instanceNameValid === false"
                :color="viewModel.form.instanceNameValid === true ? 'green' : 'red'"
                large
                >{{ viewModel.form.instanceNameValid === true ? 'mdi-check' : 'mdi-alert-octagon' }}</a-icon
              >
            </template>
          </a-text-field>
        </a-col>

        <a-col>
          <a-btn
            @click="$emit('check-url', localViewModel)"
            color="primary"
            :disabled="!localViewModel.form.plan || localViewModel.loading"
            >Check URL</a-btn
          >
        </a-col>
      </a-row>

      <a-text-field
        v-model="localViewModel.form.email"
        label="E-Mail Address of Primary User"
        placeholder="Farmer's E-Mail"
        variant="outlined"
        :rules="emailRules"
      />

      <a-text-field
        v-model="localViewModel.form.fullName"
        label="Full Name of the Farmer"
        placeholder="Farmer's Name"
        variant="outlined"
        :rules="nameRules"
      />

      <a-text-field
        v-model="localViewModel.form.farmName"
        label="Name of the Farm"
        placeholder="Farm Name"
        variant="outlined"
        :rules="nameRules"
      />

      <a-text-field
        v-model="localViewModel.form.farmAddress"
        label="Farm Address / Location"
        placeholder="123 Fake Street, Exampletown, NY"
        variant="outlined"
        :rules="addressRules"
      />

      <a-select
        label="Timezone"
        variant="outlined"
        :items="timezones"
        v-model="localViewModel.form.timezone"
        :rules="[(v) => !!v || `select time zone`]"
        return-object
      />

      <div class="text-left text-secondary">Unit System to use</div>
      <a-radio-group v-model="localViewModel.form.units">
        <a-radio label="Metric" value="metric" />
        <a-radio label="US" value="us" />
      </a-radio-group>

      <a-select
        label="Owner of the FarmOS Instance"
        variant="outlined"
        :items="localViewModel.users"
        item-value="id"
        :item-title="(item) => `${item.name} (${item.email})`"
        v-model="localViewModel.form.owner"
        :rules="[(v) => !!v || `select at least one owner`]"
        return-object
      />

      <!-- WARNING: Is not up to date as it is a comment 
        <a-select
        engineering="autocomplete"
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
        itemSlot
        prependItemSlot
        appendOuterSlot
      >
        <template v-slot:item="{ item }">
          <div v-if="item.userExists">
            {{ item.name }}
            <a-chip color="grey--darken-2" dark>{{ item.email }}</a-chip>
          </div>
          <div v-else>
            <a-icon left>mdi-account-clock</a-icon>
            {{ item.email }}
          </div>
        </template>
        <template v-slot:prepend-item>
          <a-btn
            color="primary"
            class="ma-4"
            outlined
            :to="`/memberships/new?group=${selectedGroup}&role=user`"
            @click="onInvite"
            target="_blank"
          >
            <a-icon left>mdi-account-plus</a-icon>Invite Member to Organization
          </a-btn>
          <a-divider />
        </template>
        <template v-slot:append-outer>
          <a-btn fab color="primary" style="margin-top: -16px">
            <a-icon>mdi-refresh</a-icon>
          </a-btn>
        </template>
      </a-select> -->

      <a-divider class="my-4" />

      <app-field-list
        v-if="localViewModel.form.fields.length > 0"
        v-model="localViewModel.form.fields"
      ></app-field-list>

      <a-btn class="mx-2" @click="importFields = true" v-if="!importFields">Add / Import Field</a-btn>

      <app-field-creator
        v-show="importFields"
        :loading="localViewModel.loading"
        ref="field-creator"
        v-model="field"
        @done="fieldImported"
        @cancel="cancelFieldImport"
      ></app-field-creator>

      <a-divider class="my-4" />

      <app-dialog
        labelConfirm="Refresh Members"
        class="text-primary mx-4"
        v-model="invite"
        @cancel="invite = false"
        width="400"
        >To show new members in the dropdown, please press refresh.</app-dialog
      >

      <a-checkbox
        :rules="agreeRules"
        v-model="localViewModel.form.agree"
        label="Agree to Terms of Serviceand  Privacy Policy of Farmos"
      />
      <div class="text-left mb-4">
        Visit
        <a href="https://farmier.com/terms" target="blank">Terms of Service</a>
        and
        <a href="https://farmier.com/privacy" target="blank">Privacy Policy</a>.
      </div>

      <a-btn class="mx-2" color="primary" :disabled="!valid || localViewModel.loading" @click="save"
        >Register FarmOS Instance</a-btn
      >
    </a-form>
    <app-dialog
      title="Field Import"
      labelConfirm="OK"
      class="text-primary mx-4"
      v-model="successDialog"
      @cancel="successDialog = false"
      @confirm="successDialog = false"
      width="400"
      >{{ successMessage }}</app-dialog
    >
  </a-container>
</template>

<script>
import cloneDeep from 'lodash/cloneDeep';
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
      localViewModel: cloneDeep(this.viewModel),
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
    planUrl() {
      const selectedPlanId = this.localViewModel.form.plan;

      if (selectedPlanId) {
        const plan = this.viewModel.plans.find((p) => p._id == selectedPlanId);
        if (!plan) {
          return 'Plan not found';
        }

        return plan.planUrl;
      }
      return 'Select plan first';
    },
  },
  watch: {
    viewModel: {
      deep: true,
      immediate: true,
      handler(vm) {
        console.log('change propagated', vm);
        this.localViewModel = cloneDeep(vm);
      },
    },
  },
  async mounted() {},
};
</script>
