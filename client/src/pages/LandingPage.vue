<template>
  <a-container class="home align-center" fluid>
    <div class="d-flex flex-wrap justify-center align-center row">
      <a-card color="accent-lighten-1" class="col ma-6 pa-6 align-center" style="max-width: 300px">
        <div class="text-center">
          <a-icon icon="mdi-plus-circle-outline" size="100" />
        </div>

        <a-card-text>Get started building surveys and getting responses by creating a group.</a-card-text>
        <a-card-text class="ml-4">
          <ul>
            <li>Create surveys</li>
            <li>Invite people to respond</li>
            <li>Highlight important surveys</li>
            <li>Gather Results</li>
          </ul>
        </a-card-text>
      </a-card>

      <a-card color="accent-lighten-1" class="col ma-6 pa-6" style="max-width: 300px">
        <div class="text-center">
          <a-icon icon="mdi-compass-outline" size="100" />
        </div>
        <a-card-text>See how others are using SurveyStack to do cutting edge research.</a-card-text>
        <a-card-text class="ml-4">
          <ul>
            <li>View demo surveys</li>
            <li>Explore public groups</li>
            <li>Participate in public surveys</li>
            <li>Discover new question set</li>
          </ul>
        </a-card-text>
      </a-card>

      <a-card color="accent-lighten-1" class="col ma-6 pa-6">
        <div class="text-center">
          <a-icon icon="mdi-login" size="100" />
        </div>
        <a-card-text>Log in or register</a-card-text>
        <a-card-text class="ml-4">
          <login />
        </a-card-text>
      </a-card>
    </div>
  </a-container>
</template>

<script setup>
import Login from '@/pages/auth/Login.vue';
</script>

<style scoped lang="scss">
.home {
  height: 100%;
}

>>> .container {
  padding: 0;
}
</style>
