<template>
  <v-container>
    <v-row>
      <v-col>
        <v-img
          v-if="appPartner"
          :src="appPartner.logo"
          class="my-3"
          contain
          height="128"
        ></v-img>
        <v-img
          v-else
          :src="require('../assets/surveystack_temp_logo.svg')"
          class="my-3"
          contain
          height="128"
        ></v-img>
      </v-col>
    </v-row>

    <v-row>
      <v-col align="center">
        <app-basic-list
          class="mw-40 text-left"
          v-if="pinned && pinned.length > 0"
          :entities="pinned"
          title="Get started with your surveys!"
          :link="e => `/surveys/${e.id}`"
        >
          <template v-slot:entity="{ entity }">
            <v-list-item-content>
              <v-list-item-title>{{entity.name}}</v-list-item-title>
              <v-list-item-subtitle>{{entity.group}}</v-list-item-subtitle>

            </v-list-item-content>
          </template>
        </app-basic-list>
      </v-col>
    </v-row>

    <app-login v-if="!isLoggedIn"></app-login>

    <v-row>
      <v-col align="center">
        <v-btn
          x-large
          text
          :to="`/surveys/browse`"
        >
          <v-icon left>mdi-text-box-search-outline</v-icon>Browse All Surveys
        </v-btn>
      </v-col>
    </v-row>

    <!-- <v-row v-if="showInstall">
      <v-col align="center">
        <v-btn
          color="primary"
          x-large
          @click="install"
        >
          Install App
        </v-btn>
      </v-col>
    </v-row> -->

    <v-row v-if="false">
      <v-col align="center">
        <v-btn
          color="primary"
          x-large
          href="surveystack://measurement"
        >
          Run Measurement
        </v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col align="center">
        <v-chip
          style="font-family: monospace"
          to="/app/info"
        >v{{ version }}</v-chip>
      </v-col>
    </v-row>

  </v-container>
</template>

<script>
import axios from 'axios';
import AppLogin from '@/pages/auth/Login.vue';
import AppBasicList from '@/components/ui/BasicList.vue';

export default {
  components: {
    AppLogin,
    AppBasicList,
  },
  name: 'home',
  data() {
    return {
      version: process.env.VUE_APP_VERSION,
    };
  },
  methods: {
    async focused() {
      // const res = await axios.get('http://localhost:9095/measurement');
      // console.log('result', res.data);
    },
  },


  computed: {
    appPartner() {
      return this.$store.getters['appui/partner'];
    },
    isLoggedIn() {
      return this.$store.getters['auth/isLoggedIn'];
    },
    pinned() {
      const pinned = this.$store.getters['surveys/getPinned'];
      return pinned;
    },
  },

  async created() {
    // const res = await axios.get('http://localhost:9095/measurement');
    // console.log('res', res);
  },
};
</script>
