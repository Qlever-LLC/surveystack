<template>
  <v-container>
    <h1>App Info</h1>
    <p>
      Current commit: <strong>{{ lcl.shortHash }}</strong>
    </p>

    SurveyStack is an open source project by
    <a href="https://our-sci.net" target="_blank">Our Sci</a>.
    <br />
    To view the source code visit our
    <a href="https://gitlab.com/our-sci/software/surveystack" target="_blank">Gitlab repository</a>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      version: process.env.VUE_APP_VERSION,
      lcl: JSON.parse(process.env.VUE_APP_LCL),
    };
  },
};
</script>
