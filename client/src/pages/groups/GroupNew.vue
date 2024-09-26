<script setup>
import AppNavigationControl from '@/components/AppNavigationControl.vue';
import GroupEdit from '@/components/groups/GroupEdit.vue';
import ACardText from '@/components/ui/elements/ACardText.vue';
</script>

<template>
  <a-container class="basicListContainer">
    <a-card color="background">
      <a-card-title class="text-heading d-flex pa-1">
        <a-col align="start" class="flex-grow-0">
          <AppNavigationControl />
        </a-col>
        <a-col class="flex-grow-1 pl-0" :class="'text-center'">
          <a-icon class="mr-2" icon="mdi-account-group" />
          Create Group
        </a-col>
      </a-card-title>
      <a-card-text class="mt-5">
        <group-edit scope="new" />
      </a-card-text>
    </a-card>
  </a-container>
</template>

<style scoped lang="scss"></style>
