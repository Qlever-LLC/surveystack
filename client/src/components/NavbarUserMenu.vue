<template>
  <div>
    <a-menu
      left
      attach="#app-menu"
      offset-y
      v-if="$store.getters['auth/isLoggedIn']"
      :close-on-content-click="false"
      max-height="calc(100% - 100px)"
    >
      <template v-slot:activator="{ on }">
        <v-btn text v-on="on" @click="checkIsOwner">
          <v-icon>mdi-account</v-icon>
        </v-btn>
      </template>
      <a-list flat>
        <a-list-item link :to="{ name: 'auth-profile' }">
          <a-list-item-icon>
            <v-icon>mdi-account-circle</v-icon>
          </a-list-item-icon>
          <a-list-item-title> Profile </a-list-item-title>
        </a-list-item>
        <a-list-item v-if="isOwner" link :to="{ name: 'farmos-profile' }">
          <a-list-item-icon>
            <v-icon>mdi-leaf-circle-outline</v-icon>
          </a-list-item-icon>
          <a-list-item-title> FarmOS Profile </a-list-item-title>
        </a-list-item>
        <a-divider />
        <a-list-subheader>Active Group</a-list-subheader>
        <active-group-selector-list v-model="activeGroup" />
        <a-divider />
        <a-list-item link @click="logout" class="mt-2">
          <a-list-item-icon>
            <v-icon>mdi-logout-variant</v-icon>
          </a-list-item-icon>
          <a-list-item-title> Sign Out </a-list-item-title>
        </a-list-item>
      </a-list>

      <!-- </v-card-text> -->
      <!-- </v-card> -->
    </a-menu>

    <v-btn v-else :to="{ name: 'auth-login' }" text>
      <v-icon>mdi-login-variant</v-icon>
      <span class="ml-2">Login</span>
    </v-btn>
  </div>
</template>

<script>
import ActiveGroupSelectorList from '@/components/shared/ActiveGroupSelectorList.vue';

import api from '@/services/api.service';
import AListItem from '@/components/ui/AListItem.vue';
import AListItemTitle from '@/components/ui/AListItemTitle.vue';
import AListItemIcon from '@/components/ui/AListItemIcon.vue';

export default {
  components: {
    AListItemIcon,
    AListItemTitle,
    AListItem,
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
