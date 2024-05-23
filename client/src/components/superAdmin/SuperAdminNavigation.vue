<template>
  <div class="ml-4 mt-4 text-white text-body-2">Super-Admin</div>
  <a-list dense class="px-4">
    <a-list-item
      :to="{ path: '/users' }"
      dense
      prepend-icon="mdi-account-search"
      class="text-white bg-transparent mb-2"
      rounded="lg">
      <a-list-item-title class="text-white">Users</a-list-item-title>
    </a-list-item>
    <a-list-item
      :to="{ path: '/farmos-manage' }"
      dense
      prepend-icon="mdi-leaf-circle-outline"
      class="text-white bg-transparent mb-2"
      rounded="lg">
      <a-list-item-title class="text-white">FarmOS</a-list-item-title>
    </a-list-item>
  </a-list>
</template>
<script setup></script>
