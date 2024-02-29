<template>
  <div class="ml-4 mt-4 text-white text-body-2">Drafts and Submissions</div>
  <a-list dense class="px-4">
    <a-list-item
      to="/surveys/my-submissions"
      dense
      prepend-icon="mdi-account-group"
      class="text-white bg-transparent mb-2"
      rounded="lg">
      <a-list-item-title class="text-white">All My Drafts</a-list-item-title>
    </a-list-item>
    <a-list-item
      to="/surveys/my-submissions"
      dense
      prepend-icon="mdi-account-group"
      class="text-white bg-transparent mb-2"
      rounded="lg">
      <a-list-item-title class="text-white">All My Submissions</a-list-item-title>
    </a-list-item>
  </a-list>
</template>
<script setup></script>
