<template>
  <v-container class="maxw-4">
    <template v-if="isLoggedIn">
      <p class="mt-4 mb-6">
        You are logged in as
        <strong>{{ user.email }} </strong>.
        {{ instances }}
      </p>

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
                  <v-btn text x-small class="px-1 mx-1" style="min-width: 0px" color="blue">access</v-btn>
                  <v-btn text x-small class="px-1 mx-1" style="min-width: 0px" color="black">move</v-btn>
                  <v-btn text x-small class="px-1 mx-1" style="min-width: 0px" color="red">delete</v-btn>
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

export default {
  data() {
    return {
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
      const userId = this.user._id;
      const { data } = await api.get(`/ownership/${userId}`);
      this.instances = data;
    }
  },
};
</script>
