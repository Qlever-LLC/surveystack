<template>
  <v-container>
    <h1>App Info</h1>
    <p>Version <strong>{{version}}</strong><br />
      Last commit ({{lcl.committer.relativeDate}}): <strong class="secondary--text">{{ showFullHash ? lcl.hash : lcl.shortHash }}</strong><a
        @click="showFullHash = true"
        v-if="!showFullHash"
      >...</a> </p>

    SurveyStack is an <strong>open-source project</strong>, its source code is available on GitLab for both the <a
      href="https://gitlab.com/our-sci/our-sci-pwa/"
      target="_blank"
    >front-end</a> and <a
      href="https://gitlab.com/our-sci/our-sci-server/"
      target="_blank"
    >back-end</a>.
  </v-container>
</template>

<script>

export default {
  data() {
    return {
      version: process.env.VUE_APP_VERSION,
      lcl: JSON.parse(process.env.VUE_APP_LCL),
      showFullHash: false,
    };
  },

};
</script>
