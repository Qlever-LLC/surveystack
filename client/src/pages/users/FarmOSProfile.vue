<template>
  <v-container class="maxw-4">
    <template v-if="isLoggedIn">
      <p class="mt-4 mb-6">
        You are logged in as
        <strong>{{ user.email }} </strong>.
        {{ user }}
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
            <tr>
              <td class="d-flex justify-space-between align-center">
                <div>instanceName</div>
                <div>
                  <v-btn text small class="px-1" style="min-width: 0px" color="blue">access</v-btn>
                  <v-btn text small class="px-1" style="min-width: 0px" color="black">move</v-btn>
                  <v-btn text small class="px-1" style="min-width: 0px" color="red">delete</v-btn>
                </div>
              </td>
              <td>
                <v-chip class="ma-1" close outlined color="primary"> Our Sci </v-chip>
              </td>
              <td>
                <v-chip class="ma-1" close outlined color="primary"> gbathree@gmail.com </v-chip>
              </td>
            </tr>
            <!--<tr v-for="(instance, idx) in mappedInstances" :key="`grp-${idx}`">
             <td>{{ `${instance.instanceName}` }}</td>
            <td>
              <div>
                <v-chip
                  small
                  class="ma-1"
                  dark
                  color="primary"
                  v-for="(userMapping, uidx) in instance.userMappings"
                  :key="`instance-${idx}-user-${uidx}`"
                >
                  {{ userMapping.user }}
                </v-chip>
              </div>
            </td>
            <td>
              <div>
                <v-chip
                  small
                  class="ma-1"
                  dark
                  color="primary"
                  v-for="(userMapping, uidx) in instance.userMappings"
                  :key="`instance-${idx}-user-${uidx}`"
                >
                  {{ userMapping.user }}
                </v-chip>
              </div>
            </td>
          </tr> -->
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
          {instanceName: "instanceName", isOwnerOfInstance: true, groups: ["name", "name"], otherUsers: ["email", "email"]}
          {instanceName: "instanceName", isOwnerOfInstance: false, groups: [], otherUsers: []}
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
      const userId = user._id;
      const { data } = await api.get(`/ownership/${userId}`);
      console.log(data);
      this.instances = data;
    }
  },
};
</script>
