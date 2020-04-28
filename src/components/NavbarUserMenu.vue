<template>
  <div>
    <v-menu
        offset-y
        v-if="$store.getters['auth/isLoggedIn']"
        :close-on-content-click="false"
      >
        <template v-slot:activator="{ on }">
          <v-btn
            text
            v-on="on"
          >
            <span class="d-none d-md-inline mr-1">{{$store.getters['auth/user'].email}}</span>
            <v-icon color="white">mdi-account</v-icon>
          </v-btn>
        </template>
        <v-list flat>
          <v-list-item
            link
            :to="{name: 'auth-profile'}"
          >
            <v-list-item-icon>
              <v-icon>mdi-account-circle</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              Profile
            </v-list-item-title>
          </v-list-item>
          <v-list-item
            link
            :to="{name: 'users-edit', params: { id: this.$store.state.auth.user._id }}"
          >
            <v-list-item-icon>
              <v-icon>mdi-account-edit</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              Edit Account
            </v-list-item-title>
          </v-list-item>
          <v-divider />
          <v-subheader>Active Group</v-subheader>
          <active-group-selector-list
            class=""
            v-model="activeGroup"
          />
          <v-divider />
          <v-list-item
            link
            @click="logout"
            class="mt-2"
          >
            <v-list-item-icon>
              <v-icon>mdi-logout-variant</v-icon>
            </v-list-item-icon>
            <v-list-item-title>
              Sign Out
            </v-list-item-title>
          </v-list-item>
        </v-list>

        <!-- </v-card-text> -->
        <!-- </v-card> -->
      </v-menu>

      <v-btn
        v-else
        :to="{name: 'auth-login'}"
        text
      >
        <v-icon>mdi-login-variant</v-icon>
        <span class="ml-2">Login</span>
      </v-btn>
  </div>
</template>

<script>
import ActiveGroupSelectorList from '@/components/shared/ActiveGroupSelectorList.vue';

export default {
  components: {
    ActiveGroupSelectorList,
  },
  computed: {
    activeGroup: {
      get() {
        return this.$store.getters['memberships/activeGroup'];
      },
      set(val) {
        this.$store.dispatch('memberships/setActiveGroup', val);
      },
    },
  },
  methods: {
    async logout() {
      this.$store.dispatch('auth/logout');
      this.$router.push('/auth/login');
    },
  },
};
</script>

<style>

</style>
