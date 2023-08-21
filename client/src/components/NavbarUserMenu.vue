<template>
  <div>
    <v-menu
      left
      attach="#app-menu"
      offset-y
      v-if="$store.getters['auth/isLoggedIn']"
      :close-on-content-click="false"
      max-height="calc(100% - 100px)"
    >
      <template v-slot:activator="{ on }">
        <v-btn text v-on="on" @click="checkIsOwner">
          <a-icon>mdi-account</a-icon>
        </v-btn>
      </template>
      <v-list flat>
        <v-list-item link :to="{ name: 'auth-profile' }">
          <v-list-item-icon>
            <a-icon>mdi-account-circle</a-icon>
          </v-list-item-icon>
          <v-list-item-title> Profile </v-list-item-title>
        </v-list-item>
        <v-list-item v-if="isOwner" link :to="{ name: 'farmos-profile' }">
          <v-list-item-icon>
            <a-icon>mdi-leaf-circle-outline</a-icon>
          </v-list-item-icon>
          <v-list-item-title> FarmOS Profile </v-list-item-title>
        </v-list-item>
        <v-divider />
        <v-subheader>Active Group</v-subheader>
        <active-group-selector-list v-model="activeGroup" />
        <v-divider />
        <v-list-item link @click="logout" class="mt-2">
          <v-list-item-icon>
            <a-icon>mdi-logout-variant</a-icon>
          </v-list-item-icon>
          <v-list-item-title> Sign Out </v-list-item-title>
        </v-list-item>
      </v-list>

      <!-- </v-card-text> -->
      <!-- </v-card> -->
    </v-menu>

    <v-btn v-else :to="{ name: 'auth-login' }" text>
      <a-icon>mdi-login-variant</a-icon>
      <span class="ml-2">Login</span>
    </v-btn>
  </div>
</template>

<script>
import ActiveGroupSelectorList from '@/components/shared/ActiveGroupSelectorList.vue';
import api from '@/services/api.service';
import AIcon from '@/components/ui/AIcon.vue';

export default {
  components: {
    AIcon,
    ActiveGroupSelectorList,
  },
  data() {
    return {
      isOwner: false,
    };
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
    async checkIsOwner() {
      const user = this.$store.getters['auth/user'];
      this.isOwner = false;
      if (user) {
        const userId = user._id;
        const { data } = await api.get(`/owner/${userId}`);
        this.isOwner = data;
      }
    },
    async logout() {
      this.$store.dispatch('auth/logout');
      this.$router.push('/auth/login');
    },
  },
};
</script>
