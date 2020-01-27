<template>
  <v-container>
    <v-layout text-center wrap>
      <v-flex xs12>
        <v-img :src="require('../assets/oursci.png')" class="my-3" contain height="250"></v-img>
      </v-flex>

      <v-flex mb-4>
        <h1 class="display-3 mb-3">Welcome to Our-Sci</h1>
        <p>
          <strong>Note:</strong> This is a work in progress
        </p>
        <p class="subheading font-weight-regular">
          Source code for this application can be found here
          <br />
          <a href="https://gitlab.com/our-sci/our-sci-pwa" target="_blank">Frontend</a> &
          <a href="https://gitlab.com/our-sci/our-sci-server" target="_blank">Backend</a>.
        </p>
        <p>
          Architectural entities may be
          <a
            href="https://gitlab.com/our-sci/our-sci-server/tree/master/src/architecture"
            target="_blank"
          >found here</a>
        </p>
      </v-flex>

      <v-flex mb-5 xs12>
        <h2 class="headline font-weight-bold mb-3">What's next?</h2>
        <p>The Our Sci PWA is being built...</p>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
// @ is an alias to /src

export default {
  name: 'home',
};
</script>
