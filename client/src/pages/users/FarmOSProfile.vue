<template>
  <a-dialog
    :modelValue="props.modelValue"
    @update:modelValue="closeDialog"
    @click:outside="closeDialog"
    :max-width="mobile ? '100%' : '75%'">
    <a-card color="background">
      <template v-if="isLoggedIn">
        <a-alert
          v-if="state.successMessage"
          class="mt-4"
          style="cursor: pointer"
          mode="fade"
          variant="text"
          type="success"
          @click="state.successMessage = null"
          >{{ state.successMessage }}
        </a-alert>

        <a-alert
          v-if="state.errorMessage"
          style="cursor: pointer"
          class="mt-4 cursor-pointer"
          mode="fade"
          variant="text"
          type="error">
          {{ state.errorMessage }}
        </a-alert>

        <!-- add Dialog -->
        <app-dialog
          modal
          :maxWidth="600"
          labelConfirm="Close"
          :hideCancel="true"
          v-model="state.showAddDialog"
          @cancel="resetState"
          @confirm="resetState"
          title="Add an Additional User">
          <div class="my-8">
            <p>Which user do you want to add to your instance?</p>
            <div class="d-block mb-4">
              <a-text-field v-model.trim="state.newAddedUserEmail" label="enter owner email" hide-details />
              <a-checkbox v-model="state.userIsOwner" label="this user will be an owner too" />
            </div>
            <a-alert
              v-if="state.errorDialogMessage"
              style="cursor: pointer"
              class="mt-4 cursor-pointer"
              mode="fade"
              variant="text"
              type="error"
              >{{ state.errorDialogMessage }}
            </a-alert>
            <a-btn block @click="addUser" color="primary" target="_blank"> Add</a-btn>
          </div>
        </app-dialog>
        <!-- add confirmation Dialog -->
        <app-dialog
          modal
          :maxWidth="600"
          labelConfirm="Close"
          :hideCancel="true"
          v-model="state.showConfirmAddDialog"
          @cancel="resetState"
          @confirm="resetState"
          title="Add an Additional User">
          <div class="my-8" style="color: black">
            <p class="mb-4">
              Are you sure you want to add this user {{ state.newAddedUserEmail }} to your instance?<br />
            </p>
            <a-btn block @click="confirmaddUser" color="primary" target="_blank"> Confirm</a-btn>
          </div>
        </app-dialog>

        <!-- move Dialog -->
        <app-dialog
          modal
          :maxWidth="600"
          labelConfirm="Close"
          :hideCancel="true"
          v-model="state.showMoveDialog"
          @cancel="resetState"
          @confirm="resetState"
          title="Change Ownership of FarmOS Instance">
          <div class="my-8">
            <p>To whom do you wish to transfer the ownership of this farm?</p>
            <div class="d-flex mb-4">
              <a-text-field v-model.trim="state.newOwnerEmail" label="enter new owner email" hide-details />
            </div>
            <a-alert
              v-if="state.errorDialogMessage"
              style="cursor: pointer"
              class="mt-4 cursor-pointer"
              mode="fade"
              variant="text"
              type="error"
              >{{ state.errorDialogMessage }}
            </a-alert>
            <a-btn block @click="changeOwner" color="primary" target="_blank"> Update</a-btn>
          </div>
        </app-dialog>
        <!-- move confirmation Dialog -->
        <app-dialog
          modal
          :maxWidth="600"
          labelConfirm="Close"
          :hideCancel="true"
          v-model="state.showConfirmMoveDialog"
          @cancel="resetState"
          @confirm="resetState"
          title="Change Ownership of FarmOS Instance">
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
            <a-btn block @click="confirmChangeOwner" color="primary" target="_blank"> Confirm</a-btn>
          </div>
        </app-dialog>

        <!-- remove Dialog -->
        <app-dialog
          modal
          :maxWidth="600"
          labelConfirm="Close"
          :hideCancel="true"
          v-model="state.showConfirmRemoveDialog"
          @cancel="resetState"
          @confirm="resetState"
          title="Remove FarmOS Instance">
          <div class="my-8" style="color: black">
            <p>
              Are you sure? This will disconnect your Survey Stack account from your farmOS account. You will no longer
              be able to:
            </p>
            <ol class="mb-4">
              <li>Use the Coffee Shop with this farmOS farm</li>
              <li>See this farm's fields or plantings when filling out surveys.</li>
              <li>Push data from Survey Stack surveys into this farmOS farm.</li>
            </ol>
            <a-btn block @click="confirmRemoveInstance" color="primary" target="_blank"> Confirm </a-btn>
          </div>
        </app-dialog>

        <!-- delete Dialog -->
        <app-dialog
          modal
          :maxWidth="600"
          labelConfirm="Close"
          :hideCancel="true"
          v-model="state.showConfirmDeleteDialog"
          @cancel="resetState"
          @confirm="resetState"
          title="Remove FarmOS Instance">
          <div class="my-8" style="color: black">
            <p>
              Are you sure? This will disconnect your Survey Stack account from your farmOS account. You will no longer
              be able to:
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
            <a-btn block @click="confirmDeleteInstance" color="primary" target="_blank"> Confirm </a-btn>
          </div>
        </app-dialog>

        <!-- Remove Instance From Group Dialog -->
        <app-dialog
          modal
          :maxWidth="600"
          labelConfirm="Close"
          :hideCancel="true"
          v-model="state.showConfirmRemoveInstFromGrpDialog"
          @cancel="resetState"
          @confirm="resetState"
          title="Remove Instance From Group">
          <div class="my-8" style="color: black">
            <p>
              Are you sure? Removing yourself from this group means group admins can no longer access your farmOS
              account or see your fields, plantings or logs from their account. You will also no longer be part of their
              Coffee Shop group or discussion.
            </p>
            <p>
              If you wish to completely remove access to this farm by this groups administrators, you should stop being
              a member of this group.
            </p>
            <p>This will also affect anyone else linked to this farm through Survey Stack.</p>
            <a-btn block @click="confirmRemoveInstFromGrpDialog" color="primary" target="_blank"> Confirm </a-btn>
          </div>
        </app-dialog>

        <!-- Remove Instance From Other User Dialog showConfirmRemoveInstFromOthUsrDialog -->
        <app-dialog
          modal
          :maxWidth="600"
          labelConfirm="Close"
          :hideCancel="true"
          v-model="state.showConfirmRemoveInstFromOthUsrDialog"
          @cancel="resetState"
          @confirm="resetState"
          title="Remove Instance From Group">
          <div class="my-8" style="color: black">
            <p>
              Are you sure? Removing this users access means they can no longer see your farmOS instance or access your
              fields, plantings or logs through in their surveys.
            </p>
            <a-btn block @click="confirmRemoveInstFromOthUsrDialog" color="primary" target="_blank"> Confirm </a-btn>
          </div>
        </app-dialog>

        <a-card-title class="mt-4 d-flex align-start justify-space-between" style="white-space: pre-wrap">
          FarmOS Integrations
          <a-btn color="background" @click="closeDialog" variant="flat">
            <a-icon>mdi-close</a-icon>
          </a-btn>
        </a-card-title>

        <a-card-text>
          <p class="mt-4 mb-6">
            You are logged in as
            <strong>{{ state.email }} </strong>.
          </p>

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
                <tr v-for="(instance, idx) in state.instances" :key="`grp-${idx}`">
                  <td>
                    <div class="pt-3" style="white-space: nowrap">{{ instance.instanceName }}</div>
                    <div class="pb-3">
                      <span v-if="instance.isOwner">
                        <a-btn
                          text
                          x-small
                          class="px-1 mx-1"
                          style="min-width: 0px"
                          color="blue"
                          :href="getInstanceLink(instance.instanceName)"
                          target="_blank">
                          access
                          <a-tooltip top activator="parent">Access FarmOS instance</a-tooltip>
                        </a-btn>

                        <a-btn
                          text
                          x-small
                          class="px-1 mx-1"
                          style="min-width: 0px"
                          color="black"
                          @click="addUserToInstance(instance.instanceName)">
                          add
                          <a-tooltip top activator="parent">Add a user to your instance</a-tooltip>
                        </a-btn>

                        <a-btn
                          text
                          x-small
                          class="px-1 mx-1"
                          style="min-width: 0px"
                          color="black"
                          @click="moveInstance(instance.instanceName)">
                          re-assign
                          <a-tooltip top activator="parent">Re-assign the instance's ownership</a-tooltip>
                        </a-btn>

                        <a-btn
                          text
                          x-small
                          class="px-1 mx-1"
                          style="min-width: 0px"
                          color="red"
                          @click="deleteInstance(instance.instanceName)">
                          delete
                          <a-tooltip top activator="parent">Delete this instance</a-tooltip>
                        </a-btn>
                      </span>
                      <span v-else>
                        <a-btn
                          text
                          x-small
                          class="px-1 mx-1"
                          style="min-width: 0px"
                          color="blue"
                          :href="getInstanceLink(instance.instanceName)"
                          target="_blank">
                          access
                          <a-tooltip top activator="parent">Access FarmOS instance</a-tooltip>
                        </a-btn>

                        <a-btn
                          text
                          x-small
                          class="px-1 mx-1"
                          style="min-width: 0px"
                          color="red"
                          @click="removeInstance(instance.instanceName)">
                          remove
                          <a-tooltip top activator="parent">Remove this instance</a-tooltip>
                        </a-btn>
                      </span>
                    </div>
                  </td>
                  <td>
                    <div class="py-3" v-if="instance.isOwner">
                      <a-chip
                        class="ma-1"
                        small
                        closable
                        color="green"
                        v-for="(group, uidx) in instance.groups"
                        :key="`instance-${idx}-group-${uidx}`"
                        @click:close="removeInstanceFromGroup(instance.instanceName, group.groupId)">
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
                        closable
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
        </a-card-text>
      </template>
      <template v-else>
        <a-card-title class="mt-4 d-flex align-start justify-space-between" style="white-space: pre-wrap">
          FarmOS Profile
          <a-btn color="background" @click="closeDialog" variant="flat">
            <a-icon>mdi-close</a-icon>
          </a-btn>
        </a-card-title>
        <a-card-text>
          You are not logged in...
          <router-link to="/auth/login">Go to Login</router-link>
        </a-card-text>
      </template>
    </a-card>
  </a-dialog>
</template>

<script setup>
import { reactive, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useDisplay } from 'vuetify';

import api from '@/services/api.service';
import appDialog from '@/components/ui/Dialog.vue';

const store = useStore();
const { mobile } = useDisplay();

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const state = reactive({
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
});

const isLoggedIn = computed(() => {
  return store.getters['auth/isLoggedIn'];
});
const user = computed(() => {
  return store.getters['auth/user'];
});

watch(
  () => props.modelValue,
  async (newVal) => {
    // if the dialog will be displayed
    if (newVal && user) {
      state.email = user.value.email;
      await init();
    }
  }
);

function closeDialog() {
  emit('update:modelValue', false);
}

async function init() {
  const userId = user.value._id;
  const { data } = await api.get(`/ownership/${userId}`);
  state.instances = data;
}
function getEmailsWithoutMySelf(user) {
  return user.filter((u) => u.userEmail !== state.email);
}
// access button
function getInstanceLink(instanceName) {
  return `https://${instanceName}/user/login`;
}
//add button
async function addUserToInstance(instanceName) {
  state.showAddDialog = true;
  state.instanceUnderWork = instanceName;
}
async function addUser() {
  try {
    const instanceName = state.instanceUnderWork;
    const newAddedUserEmail = state.newAddedUserEmail;
    const userIsOwner = state.userIsOwner;

    await api.post(`/farmos/available-add-user-to-instance`, {
      instanceName,
      newAddedUserEmail,
      userIsOwner,
    });
    state.showConfirmAddDialog = true;
    state.errorDialogMessage = null;
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      dialogError(error.response.data.message);
    } else {
      dialogError(error.message);
    }
    state.newAddedUserEmail = '';
  }
}
async function confirmaddUser() {
  try {
    const instanceName = state.instanceUnderWork;
    const newAddedUserEmail = state.newAddedUserEmail;
    const userIsOwner = state.userIsOwner;

    const { data } = await api.post(`/farmos/add-user-to-instance`, {
      instanceName,
      newAddedUserEmail,
      userIsOwner,
    });
    success(data);
    init();
  } catch (error) {
    errorCatched(error);
  }
  resetState();
}
// move button
async function moveInstance(instanceName) {
  state.showMoveDialog = true;
  state.instanceUnderWork = instanceName;
}
async function changeOwner() {
  try {
    const instanceName = state.instanceUnderWork;
    const newOwnerEmail = state.newOwnerEmail;

    await api.post(`/farmos/available-update-ownership`, {
      instanceName,
      newOwnerEmail,
    });
    state.showConfirmMoveDialog = true;
    state.errorDialogMessage = null;
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      dialogError(error.response.data.message);
    } else {
      dialogError(error.message);
    }
    state.newOwnerEmail = '';
  }
}
async function confirmChangeOwner() {
  try {
    const instanceName = state.instanceUnderWork;
    const newOwnerEmail = state.newOwnerEmail;

    const { data } = await api.post(`/farmos/update-ownership`, {
      instanceName,
      newOwnerEmail,
    });
    success(data);
    init();
  } catch (error) {
    errorCatched(error);
  }
  resetState();
}
// remove button
async function removeInstance(instanceName) {
  state.instanceUnderWork = instanceName;
  try {
    await api.post(`/farmos/available-remove-instance-from-user`, {
      instanceName,
    });
    state.showConfirmRemoveDialog = true;
    state.errorMessage = null;
  } catch (error) {
    errorCatched(error);
    resetState();
  }
}
async function confirmRemoveInstance() {
  try {
    const instanceName = state.instanceUnderWork;

    const { data } = await api.post(`/farmos/remove-instance-from-user`, {
      instanceName,
    });
    success(data);
    init();
  } catch (error) {
    errorCatched(error);
  }
  resetState();
}
// delete button
async function deleteInstance(instanceName) {
  state.instanceUnderWork = instanceName;
  try {
    await api.post(`/farmos/available-delete-instance-from-user`, {
      instanceName,
    });
    state.showConfirmDeleteDialog = true;
    state.errorMessage = null;
  } catch (error) {
    errorCatched(error);
    resetState();
  }
}
async function confirmDeleteInstance() {
  try {
    const instanceName = state.instanceUnderWork;

    const { data } = await api.post(`/farmos/delete-instance-from-user`, {
      instanceName,
    });
    success(data);
    init();
  } catch (error) {
    errorCatched(error);
  }
  resetState();
}
// v-chip close a group
async function removeInstanceFromGroup(instanceName, groupId) {
  state.instanceUnderWork = instanceName;
  state.groupIdUnderWork = groupId;
  try {
    await api.post(`/farmos/available-remove-instance-from-group`, {
      instanceName,
      groupId,
    });
    state.showConfirmRemoveInstFromGrpDialog = true;
    state.errorMessage = null;
  } catch (error) {
    errorCatched(error);
    resetState();
  }
}
async function confirmRemoveInstFromGrpDialog() {
  try {
    const instanceName = state.instanceUnderWork;
    const groupId = state.groupIdUnderWork;

    const { data } = await api.post(`/farmos/remove-instance-from-group`, {
      instanceName,
      groupId,
    });
    success(data);
    init();
  } catch (error) {
    errorCatched(error);
  }
  resetState();
}
// v-chip close an other user
async function removeInstanceFromOtherUser(instanceName, userId) {
  state.instanceUnderWork = instanceName;
  state.otherUserIdUnderWork = userId;
  try {
    await api.post(`/farmos/available-remove-instance-from-other-user`, {
      instanceName,
      userId,
    });
    state.showConfirmRemoveInstFromOthUsrDialog = true;
    state.errorMessage = null;
  } catch (error) {
    errorCatched(error);
    resetState();
  }
}
async function confirmRemoveInstFromOthUsrDialog() {
  try {
    const instanceName = state.instanceUnderWork;
    const userId = state.otherUserIdUnderWork;

    const { data } = await api.post(`/farmos/remove-instance-from-other-user`, {
      instanceName,
      userId,
    });
    success(data);
    init();
  } catch (error) {
    errorCatched(error);
  }
  resetState();
}

function resetState() {
  state.instanceUnderWork = '';
  state.groupIdUnderWork = '';
  state.showAddDialog = false;
  state.newAddedUserEmail = '';
  state.userIsOwner = false;
  state.showMoveDialog = false;
  state.newOwnerEmail = '';
  state.showConfirmAddDialog = false;
  state.showConfirmMoveDialog = false;
  state.showConfirmRemoveDialog = false;
  state.showConfirmDeleteDialog = false;
  state.showConfirmRemoveInstFromGrpDialog = false;
  state.showConfirmRemoveInstFromOthUsrDialog = false;
}

function success(msg) {
  if (state.timeoutID) {
    clearTimeout(state.timeoutID);
  }
  state.successMessage = msg;
  state.errorMessage = null;
  window.scrollTo(0, 0);
  state.timeoutID = setTimeout(() => {
    state.successMessage = null;
    state.timeoutID = null;
  }, 15000);
}
function errorCatched(error) {
  if (error.response && error.response.data && error.response.data.message) {
    errorWithTimeout(error.response.data.message);
  } else {
    errorWithTimeout(error.message);
  }
}
function errorWithTimeout(msg) {
  if (state.timeoutID) {
    clearTimeout(state.timeoutID);
  }
  state.errorMessage = msg;
  state.successMessage = null;
  window.scrollTo(0, 0);
  state.timeoutID = setTimeout(() => {
    state.errorMessage = null;
    state.timeoutID = null;
  }, 15000);
}
function dialogError(msg) {
  state.errorDialogMessage = msg;
}
</script>
