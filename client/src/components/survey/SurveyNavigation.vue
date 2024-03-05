<template>
  <div class="ml-4 mt-4 text-white text-body-2">Surveys</div>
  <a-list dense class="px-4">
    <a-list-item
      :to="{ path: '/surveys/browse', query: { t: Date.now() } }"
      dense
      prepend-icon="mdi-account-group"
      class="text-white bg-transparent mb-2"
      rounded="lg">
      <a-list-item-title class="text-white">All Surveys</a-list-item-title>
    </a-list-item>
  </a-list>
</template>
<script setup></script>
