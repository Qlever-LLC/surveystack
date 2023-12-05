<template>
  <div>
    <a-menu
      v-if="isLoggedIn"
      attach="#app-menu"
      :close-on-content-click="false"
      max-height="calc(100% - 100px)"
      v-model="menuIsOpen"
      location="bottom"
    >
      <template v-slot:activator="{ props }">
        <a-btn variant="text" v-bind="props" @click="checkIsOwner(props)">
          <a-icon>mdi-account</a-icon>
        </a-btn>
      </template>
      <a-list flat>
        <a-list-item link :to="{ name: 'auth-profile' }" prepend-icon="mdi-account-circle">
          <a-list-item-title> Profile </a-list-item-title>
        </a-list-item>
        <a-list-item v-if="isOwner" link :to="{ name: 'farmos-profile' }" prepend-icon="mdi-leaf-circle-outline">
          <a-list-item-title> FarmOS Profile </a-list-item-title>
        </a-list-item>
        <a-divider />
        <a-list-subheader>Active Group</a-list-subheader>
        <active-group-selector-list v-model="activeGroup" />
        <a-divider />
        <a-list-item link @click="logout" class="mt-2" prepend-icon="mdi-logout-variant">
          <a-list-item-title> Sign Out </a-list-item-title>
        </a-list-item>
      </a-list>
    </a-menu>

    <a-btn v-else :to="{ name: 'auth-login' }" variant="text">
      <a-icon>mdi-login-variant</a-icon>
      <span class="ml-2">Login</span>
    </a-btn>
  </div>
</template>

<script>
import ActiveGroupSelectorList from '@/components/shared/ActiveGroupSelectorList.vue';

import api from '@/services/api.service';

export default {
  components: {
    ActiveGroupSelectorList,
  },
  data() {
    return {
      menuIsOpen: false,
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
    isLoggedIn() {
      return this.$store.getters['auth/isLoggedIn'];
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
