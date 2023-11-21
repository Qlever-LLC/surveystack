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
        <strong>{{ email }} </strong>.
      </p>

      <!-- add Dialog -->
      <app-dialog
        modal
        :maxWidth="600"
        labelConfirm="Close"
        :hideCancel="true"
        v-model="showAddDialog"
        @cancel="closeAndReset"
        @confirm="closeAndReset"
        title="Add an Additional User"
      >
        <div class="my-8">
          <p>Which user do you want to add to your instance?</p>
          <div class="d-block mb-4">
            <a-text-field v-model.trim="newAddedUserEmail" label="enter owner email" hide-details />
            <v-checkbox v-model="userIsOwner" label="this user will be an owner too"></v-checkbox>
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
          <v-btn block @click="addUser" color="primary" target="_blank"> Add </v-btn>
        </div>
      </app-dialog>
      <!-- add confirmation Dialog -->
      <app-dialog
        modal
        :maxWidth="600"
        labelConfirm="Close"
        :hideCancel="true"
        v-model="showConfirmAddDialog"
        @cancel="closeAndReset"
        @confirm="closeAndReset"
        title="Add an Additional User"
      >
        <div class="my-8" style="color: black">
          <p class="mb-4">Are you sure you want to add this user {{ newAddedUserEmail }} to your instance?<br /></p>
          <v-btn block @click="confirmaddUser" color="primary" target="_blank"> Confirm</v-btn>
        </div>
      </app-dialog>

      <!-- move Dialog -->
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
            <a-text-field v-model.trim="newOwnerEmail" label="enter new owner email" hide-details />
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
      <!-- move confirmation Dialog -->
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
          <ol class="mb-4">
            <li>No longer have full administrative control over your farmOS farm instance.</li>
            <li>Not be able to control access to your farm by groups or users.</li>
          </ol>
          <p>
            You will still be able to see fields, plantings and logs in your Survey Stack surveys and push surveys to
            that farm.
          </p>
          <v-btn block @click="confirmChangeOwner" color="primary" target="_blank"> Confirm</v-btn>
        </div>
      </app-dialog>

      <!-- remove Dialog -->
      <app-dialog
        modal
        :maxWidth="600"
        labelConfirm="Close"
        :hideCancel="true"
        v-model="showConfirmRemoveDialog"
        @cancel="closeAndReset"
        @confirm="closeAndReset"
        title="Remove FarmOS Instance"
      >
        <div class="my-8" style="color: black">
          <p>
            Are you sure? This will disconnect your Survey Stack account from your farmOS account. You will no longer be
            able to:
          </p>
          <ol class="mb-4">
            <li>Use the Coffee Shop with this farmOS farm</li>
            <li>See this farm's fields or plantings when filling out surveys.</li>
            <li>Push data from Survey Stack surveys into this farmOS farm.</li>
          </ol>
          <v-btn block @click="confirmRemoveInstance" color="primary" target="_blank"> Confirm</v-btn>
        </div>
      </app-dialog>

      <!-- delete Dialog -->
      <app-dialog
        modal
        :maxWidth="600"
        labelConfirm="Close"
        :hideCancel="true"
        v-model="showConfirmDeleteDialog"
        @cancel="closeAndReset"
        @confirm="closeAndReset"
        title="Remove FarmOS Instance"
      >
        <div class="my-8" style="color: black">
          <p>
            Are you sure? This will disconnect your Survey Stack account from your farmOS account. You will no longer be
            able to:
          </p>
          <ol class="mb-4">
            <li>Use the Coffee Shop with this farmOS farm</li>
            <li>See this farm's fields or plantings when filling out surveys.</li>
            <li>Push data from Survey Stack surveys into this farmOS farm.</li>
          </ol>
          <p>
            Unlinking the account will also disconnect this account from all groups and other users who would have
            access to it.
          </p>
          <p>
            Unlinking the account will mean you will be responsible for paying for your farmOS farm through Farmier
            hosting directly. You will receive an email from Farmier to sign up to pay directly through them. If you
            wish to continue access your farmOS farm you should sign up with hosting through Farmier at that point.
          </p>
          <p>If you want to transfer ownership of this farm to someone else, press the 'move' button instead.</p>
          <v-btn block @click="confirmDeleteInstance" color="primary" target="_blank"> Confirm</v-btn>
        </div>
      </app-dialog>

      <!-- Remove Instance From Group Dialog -->
      <app-dialog
        modal
        :maxWidth="600"
        labelConfirm="Close"
        :hideCancel="true"
        v-model="showConfirmRemoveInstFromGrpDialog"
        @cancel="closeAndReset"
        @confirm="closeAndReset"
        title="Remove Instance From Group"
      >
        <div class="my-8" style="color: black">
          <p>
            Are you sure? Removing yourself from this group means group admins can no longer access your farmOS account
            or see your fields, plantings or logs from their account. You will also no longer be part of their Coffee
            Shop group or discussion.
          </p>
          <p>
            If you wish to completely remove access to this farm by this groups administrators, you should stop being a
            member of this group.
          </p>
          <p>This will also affect anyone else linked to this farm through Survey Stack.</p>
          <v-btn block @click="confirmRemoveInstFromGrpDialog" color="primary" target="_blank"> Confirm</v-btn>
        </div>
      </app-dialog>

      <!-- Remove Instance From Other User Dialog showConfirmRemoveInstFromOthUsrDialog -->
      <app-dialog
        modal
        :maxWidth="600"
        labelConfirm="Close"
        :hideCancel="true"
        v-model="showConfirmRemoveInstFromOthUsrDialog"
        @cancel="closeAndReset"
        @confirm="closeAndReset"
        title="Remove Instance From Group"
      >
        <div class="my-8" style="color: black">
          <p>
            Are you sure? Removing this users access means they can no longer see your farmOS instance or access your
            fields, plantings or logs through in their surveys.
          </p>
          <v-btn block @click="confirmRemoveInstFromOthUsrDialog" color="primary" target="_blank"> Confirm</v-btn>
        </div>
      </app-dialog>

      <div class="d-flex">
        <h2>FarmOS Integrations</h2>
      </div>

      <a-table class="mt-8">
        <template v-slot>
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
                <div class="pt-3" style="white-space: nowrap">{{ instance.instanceName }}</div>
                <div class="pb-3">
                  <span v-if="instance.isOwner">
                    <v-tooltip top>
                      <template v-slot:activator="{ on }">
                        <v-btn
                          v-on="on"
                          text
                          x-small
                          class="px-1 mx-1"
                          style="min-width: 0px"
                          color="blue"
                          :href="getInstanceLink(instance.instanceName)"
                          target="_blank"
                        >
                          access
                        </v-btn>
                      </template>
                      <span>Access FarmOS instance</span>
                    </v-tooltip>

                    <v-tooltip top>
                      <template v-slot:activator="{ on }">
                        <v-btn
                          v-on="on"
                          text
                          x-small
                          class="px-1 mx-1"
                          style="min-width: 0px"
                          color="black"
                          @click="addUserToInstance(instance.instanceName)"
                        >
                          add
                        </v-btn>
                      </template>
                      <span>Add a user to your instance</span>
                    </v-tooltip>

                    <v-tooltip top>
                      <template v-slot:activator="{ on }">
                        <v-btn
                          v-on="on"
                          text
                          x-small
                          class="px-1 mx-1"
                          style="min-width: 0px"
                          color="black"
                          @click="moveInstance(instance.instanceName)"
                        >
                          re-assign
                        </v-btn>
                      </template>
                      <span>Re-assign the instance's ownership</span>
                    </v-tooltip>

                    <v-tooltip top>
                      <template v-slot:activator="{ on }">
                        <v-btn
                          v-on="on"
                          text
                          x-small
                          class="px-1 mx-1"
                          style="min-width: 0px"
                          color="red"
                          @click="deleteInstance(instance.instanceName)"
                        >
                          delete
                        </v-btn>
                      </template>
                      <span>Delete this instance</span>
                    </v-tooltip>
                  </span>
                  <span v-else>
                    <v-tooltip top>
                      <template v-slot:activator="{ on }">
                        <v-btn
                          v-on="on"
                          text
                          x-small
                          class="px-1 mx-1"
                          style="min-width: 0px"
                          color="blue"
                          :href="getInstanceLink(instance.instanceName)"
                          target="_blank"
                        >
                          access
                        </v-btn>
                      </template>
                      <span>Access FarmOS instance</span>
                    </v-tooltip>

                    <v-tooltip top>
                      <template v-slot:activator="{ on }">
                        <v-btn
                          v-on="on"
                          text
                          x-small
                          class="px-1 mx-1"
                          style="min-width: 0px"
                          color="red"
                          @click="removeInstance(instance.instanceName)"
                        >
                          remove
                        </v-btn>
                      </template>
                      <span>Remove this instance</span>
                    </v-tooltip>
                  </span>
                </div>
              </td>
              <td>
                <div class="py-3" v-if="instance.isOwner">
                  <a-chip
                    class="ma-1"
                    small
                    close
                    dark
                    color="green"
                    v-for="(group, uidx) in instance.groups"
                    :key="`instance-${idx}-group-${uidx}`"
                    @click:close="removeInstanceFromGroup(instance.instanceName, group.groupId)"
                  >
                    {{ group.groupName }}
                  </a-chip>
                </div>
                <div v-else>only owners may view this information</div>
              </td>
              <td>
                <div class="py-3" v-if="instance.isOwner">
                  <a-chip
                    class="ma-1"
                    small
                    close
                    dark
                    color="blue"
                    v-for="(user, uidx) in getEmailsWithoutMySelf(instance.otherUsers)"
                    :key="`instance-${idx}-user-${uidx}`"
                    @click:close="removeInstanceFromOtherUser(instance.instanceName, user.userId)"
                    ><span v-if="user.owner" class="mdi mdi-crown pr-1"></span>
                    {{ user.userEmail }}
                  </a-chip>
                </div>
                <div v-else>only owners may view this information</div>
              </td>
            </tr>
          </tbody>
        </template>
      </a-table>

      <div style="margin-top: 100px !important">
        <p><b>If you have questions or need support reach out to your group admin or email info@our-sci.net.</b></p>
      </div>
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
      timeoutID: null,
      successMessage: null,
      errorMessage: null,
      errorDialogMessage: null,

      instanceUnderWork: '',
      groupIdUnderWork: '',
      otherUserIdUnderWork: '',

      showAddDialog: false,
      newAddedUserEmail: '',
      userIsOwner: false,
      showConfirmAddDialog: false,

      showMoveDialog: false,
      newOwnerEmail: '',
      showConfirmMoveDialog: false,

      showConfirmRemoveDialog: false,
      showConfirmDeleteDialog: false,
      showConfirmRemoveInstFromGrpDialog: false,
      showConfirmRemoveInstFromOthUsrDialog: false,

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
              { "userId":"string id", "userEmail": "email", owner: true},
              { "userId":"string id", "userEmail": "email", owner: false},
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
    getEmailsWithoutMySelf(user) {
      return user.filter((u) => u.userEmail !== this.email);
    },
    // access button
    getInstanceLink(instanceName) {
      return `https://${instanceName}/user/login`;
    },
    //add button
    async addUserToInstance(instanceName) {
      this.showAddDialog = true;
      this.instanceUnderWork = instanceName;
    },
    async addUser() {
      try {
        const instanceName = this.instanceUnderWork;
        const newAddedUserEmail = this.newAddedUserEmail;
        const userIsOwner = this.userIsOwner;

        await api.post(`/farmos/available-add-user-to-instance`, {
          instanceName,
          newAddedUserEmail,
          userIsOwner,
        });
        this.showConfirmAddDialog = true;
        this.errorDialogMessage = null;
      } catch (error) {
        if (error.response && error.response.data && error.response.data.message) {
          this.dialogError(error.response.data.message);
        } else {
          this.dialogError(error.message);
        }
        this.newAddedUserEmail = '';
      }
    },
    async confirmaddUser() {
      try {
        const instanceName = this.instanceUnderWork;
        const newAddedUserEmail = this.newAddedUserEmail;
        const userIsOwner = this.userIsOwner;

        const { data } = await api.post(`/farmos/add-user-to-instance`, {
          instanceName,
          newAddedUserEmail,
          userIsOwner,
        });
        this.success(data);
        this.init();
      } catch (error) {
        this.errorCatched(error);
      }
      this.closeAndReset();
    },
    // move button
    async moveInstance(instanceName) {
      this.showMoveDialog = true;
      this.instanceUnderWork = instanceName;
    },
    async changeOwner() {
      try {
        const instanceName = this.instanceUnderWork;
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
        const instanceName = this.instanceUnderWork;
        const newOwnerEmail = this.newOwnerEmail;

        const { data } = await api.post(`/farmos/update-ownership`, {
          instanceName,
          newOwnerEmail,
        });
        this.success(data);
        this.init();
      } catch (error) {
        this.errorCatched(error);
      }
      this.closeAndReset();
    },
    // remove button
    async removeInstance(instanceName) {
      this.instanceUnderWork = instanceName;
      try {
        await api.post(`/farmos/available-remove-instance-from-user`, {
          instanceName,
        });
        this.showConfirmRemoveDialog = true;
        this.error = null;
      } catch (error) {
        this.errorCatched(error);
        this.closeAndReset();
      }
    },
    async confirmRemoveInstance() {
      try {
        const instanceName = this.instanceUnderWork;

        const { data } = await api.post(`/farmos/remove-instance-from-user`, {
          instanceName,
        });
        this.success(data);
        this.init();
      } catch (error) {
        this.errorCatched(error);
      }
      this.closeAndReset();
    },
    // delete button
    async deleteInstance(instanceName) {
      this.instanceUnderWork = instanceName;
      try {
        await api.post(`/farmos/available-delete-instance-from-user`, {
          instanceName,
        });
        this.showConfirmDeleteDialog = true;
        this.error = null;
      } catch (error) {
        this.errorCatched(error);
        this.closeAndReset();
      }
    },
    async confirmDeleteInstance() {
      try {
        const instanceName = this.instanceUnderWork;

        const { data } = await api.post(`/farmos/delete-instance-from-user`, {
          instanceName,
        });
        this.success(data);
        this.init();
      } catch (error) {
        this.errorCatched(error);
      }
      this.closeAndReset();
    },
    // v-chip close a group
    async removeInstanceFromGroup(instanceName, groupId) {
      this.instanceUnderWork = instanceName;
      this.groupIdUnderWork = groupId;
      try {
        await api.post(`/farmos/available-remove-instance-from-group`, {
          instanceName,
          groupId,
        });
        this.showConfirmRemoveInstFromGrpDialog = true;
        this.error = null;
      } catch (error) {
        this.errorCatched(error);
        this.closeAndReset();
      }
    },
    async confirmRemoveInstFromGrpDialog() {
      try {
        const instanceName = this.instanceUnderWork;
        const groupId = this.groupIdUnderWork;

        const { data } = await api.post(`/farmos/remove-instance-from-group`, {
          instanceName,
          groupId,
        });
        this.success(data);
        this.init();
      } catch (error) {
        this.errorCatched(error);
      }
      this.closeAndReset();
    },
    // v-chip close an other user
    async removeInstanceFromOtherUser(instanceName, userId) {
      this.instanceUnderWork = instanceName;
      this.otherUserIdUnderWork = userId;
      try {
        await api.post(`/farmos/available-remove-instance-from-other-user`, {
          instanceName,
          userId,
        });
        this.showConfirmRemoveInstFromOthUsrDialog = true;
        this.error = null;
      } catch (error) {
        this.errorCatched(error);
        this.closeAndReset();
      }
    },
    async confirmRemoveInstFromOthUsrDialog() {
      try {
        const instanceName = this.instanceUnderWork;
        const userId = this.otherUserIdUnderWork;

        const { data } = await api.post(`/farmos/remove-instance-from-other-user`, {
          instanceName,
          userId,
        });
        this.success(data);
        this.init();
      } catch (error) {
        this.errorCatched(error);
      }
      this.closeAndReset();
    },

    closeAndReset() {
      this.instanceUnderWork = '';
      this.groupIdUnderWork = '';
      this.showAddDialog = false;
      this.newAddedUserEmail = '';
      this.userIsOwner = false;
      this.showMoveDialog = false;
      this.newOwnerEmail = '';
      this.showConfirmAddDialog = false;
      this.showConfirmMoveDialog = false;
      this.showConfirmRemoveDialog = false;
      this.showConfirmDeleteDialog = false;
      this.showConfirmRemoveInstFromGrpDialog = false;
      this.showConfirmRemoveInstFromOthUsrDialog = false;
    },

    success(msg) {
      if (this.timeoutID) {
        clearTimeout(this.timeoutID);
      }
      this.successMessage = msg;
      this.errorMessage = null;
      window.scrollTo(0, 0);
      this.timeoutID = setTimeout(() => {
        this.successMessage = null;
        this.timeoutID = null;
      }, 15000);
    },
    errorCatched(error) {
      if (error.response && error.response.data && error.response.data.message) {
        this.error(error.response.data.message);
      } else {
        this.error(error.message);
      }
    },
    error(msg) {
      if (this.timeoutID) {
        clearTimeout(this.timeoutID);
      }
      this.errorMessage = msg;
      this.successMessage = null;
      window.scrollTo(0, 0);
      this.timeoutID = setTimeout(() => {
        this.errorMessage = null;
        this.timeoutID = null;
      }, 15000);
    },
    dialogError(msg) {
      this.errorDialogMessage = msg;
    },
  },
};
</script>
