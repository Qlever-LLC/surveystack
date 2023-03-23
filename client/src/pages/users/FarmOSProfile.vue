<template>
  <v-container class="maxw-4">
    <template v-if="isLoggedIn">
      <v-alert
        v-if="successMessage"
        class="mt-4"
        style="cursor: pointer"
        mode="fade"
        text
        type="success"
        @click="successMessage = null"
        >{{ successMessage }}</v-alert
      >

      <v-alert v-if="errorMessage" style="cursor: pointer" class="mt-4 cursor-pointer" mode="fade" text type="error">{{
        errorMessage
      }}</v-alert>

      <p class="mt-4 mb-6">
        You are logged in as
        <strong>{{ user.email }} </strong>.
      </p>
      <app-dialog
        modal
        :maxWidth="600"
        labelConfirm="Close"
        :hideCancel="true"
        v-model="showLinkDialog"
        @cancel="closeAndReset"
        @confirm="closeAndReset"
        title="Access FarmOS Instance"
      >
        <div class="d-flex justify-center my-8">
          <v-btn
            :loading="!linkReady"
            :disabled="!linkReady"
            :href="adminLink"
            @click="closeAndReset"
            color="primary"
            target="_blank"
          >
            {{ linkReady ? 'Access' : 'Loading' }}</v-btn
          >
        </div>
      </app-dialog>

      <app-dialog
        modal
        :maxWidth="600"
        labelConfirm="Close"
        :hideCancel="true"
        v-model="showMoveDialog"
        @cancel="closeAndReset"
        @confirm="closeAndReset"
        title="Change Ownership of FarmOS Instance"
      >
        <div class="my-8">
          <p>To whom do you wish to transfer the ownership of this farm?</p>
          <div class="d-flex mb-4">
            <v-text-field v-model.trim="newOwnerEmail" label="enter new owner email" hide-details></v-text-field>
          </div>
          <v-alert
            v-if="errorDialogMessage"
            style="cursor: pointer"
            class="mt-4 cursor-pointer"
            mode="fade"
            text
            type="error"
            >{{ errorDialogMessage }}</v-alert
          >
          <v-btn block @click="changeOwner" color="primary" target="_blank"> Update</v-btn>
        </div>
      </app-dialog>
      <app-dialog
        modal
        :maxWidth="600"
        labelConfirm="Close"
        :hideCancel="true"
        v-model="showConfirmMoveDialog"
        @cancel="closeAndReset"
        @confirm="closeAndReset"
        title="Change Ownership of FarmOS Instance"
      >
        <div class="my-8" style="color: black">
          <p>
            Are you sure you want to move ownership to another Survey Stack user?<br />
            By doing so you will:
          </p>
          <ul>
            1. No longer have full administrative control over your farmOS farm instance.<br />
            2. Not be able to control access to your farm by groups or users.<br />
          </ul>
          <p>
            You will still be able to see fields, plantings and logs in your Survey Stack surveys and push surveys to
            that farm.
          </p>
          <v-btn block @click="confirmChangeOwner" color="primary" target="_blank"> Confirm</v-btn>
        </div>
      </app-dialog>

      <div class="d-flex justify-space-between">
        <h2>FarmOS Integrations</h2>
        <v-btn disabled color="primary">Connect from Farmier</v-btn>
      </div>
      <div class="ma-4">
        <p>
          <b>I need to create a farm!</b> To create a new FarmOS Farm through SurveyStack, you should join or create a
          group. You can only create new farms inside groups (see <b>SurveyStack Pricing Tiers</b> for details).
        </p>
        <p>
          <b>I already have a FarmOS Farm through Farmier!</b> You can connect it by clicking on 'Connect from Farmier'.
          Please review <b>FarmOS Privacy</b> notes for how this affects access to your farm data.
        </p>
        <p>
          <b>I want to remove access to my farm for one or more groups</b>. Review the groups with access below. If you
          want to fully remove access from a group, go to <b>My Groups</b> and remove yourself as a member.
        </p>
      </div>

      <v-simple-table>
        <template v-slot:default>
          <thead>
            <tr>
              <th class="text-left">FarmOS Farm URL</th>
              <th class="text-left">Groups with access</th>
              <th class="text-left">Other users with access</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(instance, idx) in instances" :key="`grp-${idx}`">
              <td>
                <div style="white-space: nowrap">{{ `${instance.instanceName}` }}</div>
                <div>
                  <span v-if="instance.isOwner">
                    <v-btn
                      text
                      x-small
                      class="px-1 mx-1"
                      style="min-width: 0px"
                      color="blue"
                      @click="accessInstance(instance.instanceName)"
                      >access</v-btn
                    >
                    <v-btn
                      text
                      x-small
                      class="px-1 mx-1"
                      style="min-width: 0px"
                      color="black"
                      @click="moveInstance(instance.instanceName)"
                      >move</v-btn
                    >
                    <v-btn text x-small class="px-1 mx-1" style="min-width: 0px" color="red">delete</v-btn>
                  </span>
                  <span v-else>
                    <v-btn
                      text
                      x-small
                      class="px-1 mx-1"
                      style="min-width: 0px"
                      color="blue"
                      @click="accessInstance(instance.instanceName)"
                      >access</v-btn
                    >
                    <v-btn text x-small class="px-1 mx-1" style="min-width: 0px" color="red">remove</v-btn>
                  </span>
                </div>
              </td>
              <td>
                <div v-if="instance.isOwner">
                  <v-chip
                    class="ma-1"
                    small
                    close
                    v-for="(group, uidx) in instance.groups"
                    :key="`instance-${idx}-group-${uidx}`"
                  >
                    {{ group.groupName }}
                  </v-chip>
                </div>
                <div v-else>only owners may view this information</div>
              </td>
              <td>
                <div v-if="instance.isOwner">
                  <v-chip
                    class="ma-1"
                    small
                    close
                    v-for="(user, uidx) in instance.otherUsers"
                    :key="`instance-${idx}-user-${uidx}`"
                  >
                    {{ user.userEmail }}
                  </v-chip>
                </div>
                <div v-else>only owners may view this information</div>
              </td>
            </tr>
          </tbody>
        </template>
      </v-simple-table>
    </template>
    <template v-else>
      <h1>FarmOS Profile</h1>
      You are not logged in... <router-link to="/auth/login">Go to Login</router-link>
    </template>
  </v-container>
</template>

<script>
import api from '@/services/api.service';
import appDialog from '@/components/ui/Dialog.vue';

export default {
  components: {
    appDialog,
  },
  data() {
    return {
      successMessage: null,
      errorMessage: null,
      errorDialogMessage: null,

      showLinkDialog: false,
      adminLink: '',
      linkReady: false,

      showMoveDialog: false,
      instanceOnWhichOwnerChanges: '',
      newOwnerEmail: '',
      showConfirmMoveDialog: false,

      email: '',
      instances: [],
      /*
        [
          {
            instanceName: "instanceName",
            isOwner: true,
            groups: [
              { "groupId":"string id", "groupName": "name"},
              { "groupId":"string id", "groupName": "name"},
            ],
            otherUsers: [
              { "userId":"string id", "userEmail": "email"},
              { "userId":"string id", "userEmail": "email"},
            ]
          },
          {
            instanceName: "instanceName",
            isOwner: false
          }
        ]
      */
    };
  },
  computed: {
    isLoggedIn() {
      return this.$store.getters['auth/isLoggedIn'];
    },
    user() {
      return this.$store.getters['auth/user'];
    },
  },
  async created() {
    if (this.user) {
      this.email = this.user.email;
      await this.init();
    }
  },
  methods: {
    async init() {
      const userId = this.user._id;
      const { data } = await api.get(`/ownership/${userId}`);
      this.instances = data;
    },
    async accessInstance(instanceName) {
      try {
        this.showLinkDialog = true;
        const { data: link } = await api.post(`/farmos/get-farm-owner-link`, {
          instanceName,
        });
        this.adminLink = link;
        this.linkReady = true;
      } catch (error) {
        if (error.response && error.response.data && error.response.data.message) {
          this.error(error.response.data.message);
        } else {
          this.error(error.message);
        }
        this.closeAndReset();
      }
    },
    async moveInstance(instanceName) {
      this.showMoveDialog = true;
      this.instanceOnWhichOwnerChanges = instanceName;
    },

    async changeOwner() {
      try {
        const instanceName = this.instanceOnWhichOwnerChanges;
        const newOwnerEmail = this.newOwnerEmail;

        await api.post(`/farmos/available-update-ownership`, {
          instanceName,
          newOwnerEmail,
        });
        this.showConfirmMoveDialog = true;
        this.errorDialogMessage = null;
      } catch (error) {
        if (error.response && error.response.data && error.response.data.message) {
          this.dialogError(error.response.data.message);
        } else {
          this.dialogError(error.message);
        }
        this.newOwnerEmail = '';
      }
    },
    async confirmChangeOwner() {
      try {
        const instanceName = this.instanceOnWhichOwnerChanges;
        const newOwnerEmail = this.newOwnerEmail;

        const { data } = await api.post(`/farmos/update-ownership`, {
          instanceName,
          newOwnerEmail,
        });
        this.success(data);
        this.init();
      } catch (error) {
        if (error.response && error.response.data && error.response.data.message) {
          this.error(error.response.data.message);
        } else {
          this.error(error.message);
        }
      }
      this.closeAndReset();
    },
    closeAndReset() {
      this.linkReady = false;
      this.showLinkDialog = false;
      this.adminLink = '';
      this.showMoveDialog = false;
      this.newOwnerEmail = '';
      this.showConfirmMoveDialog = false;
    },

    success(msg) {
      this.successMessage = msg;
      this.errorMessage = null;
      window.scrollTo(0, 0);
    },
    error(msg) {
      this.errorMessage = msg;
      this.successMessage = null;
      window.scrollTo(0, 0);
    },
    dialogError(msg) {
      this.errorDialogMessage = msg;
    },
  },
};
</script>
