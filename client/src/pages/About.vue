<template>
  <div class="about">
    <a-layout text-center wrap>
      <a-flex class="mb-4 mt-8">
        <h1 class="display-2 mb-3">Welcome to SurveyStack</h1>
        <p><strong>Note:</strong> This is a work in progress</p>

        <div class="text-center ma-8" v-if="showInstall">
          <a-btn @click="install" large color="primary">Install</a-btn>
        </div>

        <p class="subheading font-weight-regular">
          Source code for this application can be found here
          <br />
          <a href="https://gitlab.com/our-sci/our-sci-pwa" target="_blank">Frontend</a> &
          <a href="https://gitlab.com/our-sci/our-sci-server" target="_blank">Backend</a>.
        </p>
      </a-flex>
    </a-layout>
  </div>
</template>
<script>
export default {};
</script>
