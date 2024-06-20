<template>
  <farm-o-s-profile v-model="state.showFarmosProfile"></farm-o-s-profile>
  <a-menu
    v-if="isLoggedIn"
    :close-on-content-click="false"
    max-height="calc(100% - 100px)"
    v-model="state.menuIsOpen"
    location="bottom">
    <template v-slot:activator="{ props }">
      <a-btn variant="text" v-bind="props" @click="checkIsOwner()">
        <a-icon large color="white">mdi-account</a-icon>
      </a-btn>
    </template>
    <a-list flat>
      <a-list-item link to="/auth/profile" prepend-icon="mdi-account-circle">
        <a-list-item-title> Profile </a-list-item-title>
      </a-list-item>
      <a-list-item v-if="state.isOwner" link @click="displayFarmOSProfile" prepend-icon="mdi-leaf-circle-outline">
        <a-list-item-title> FarmOS Profile </a-list-item-title>
      </a-list-item>
      <a-divider />
      <a-list-item link @click="logout" class="mt-2" prepend-icon="mdi-logout-variant">
        <a-list-item-title> Sign Out </a-list-item-title>
      </a-list-item>
    </a-list>
  </a-menu>

  <a-btn v-else :to="{ name: 'home' }" variant="text" large color="white">
    <a-icon>mdi-login-variant</a-icon>
    <span class="ml-2">Login</span>
  </a-btn>
</template>

<script setup>
import { reactive, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

import api from '@/services/api.service';

import FarmOSProfile from '@/pages/users/FarmOSProfile.vue';

const store = useStore();
const router = useRouter();

const state = reactive({
  menuIsOpen: false,
  isOwner: false,
  showFarmosProfile: false,
});

const isLoggedIn = computed(() => {
  return store.getters['auth/isLoggedIn'];
});

function displayFarmOSProfile() {
  state.showFarmosProfile = true;
}

async function checkIsOwner() {
  const user = store.getters['auth/user'];
  state.isOwner = false;
  if (user) {
    const userId = user._id;
    const { data } = await api.get(`/owner/${userId}`);
    state.isOwner = data;
  }
}
async function logout() {
  store.dispatch('auth/logout');
  router.push('/');
}
</script>
