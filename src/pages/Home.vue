<template>
  <v-container>
    <v-row>
      <v-col>
        <v-img
          v-if="isWhitelabel"
          :src="$store.getters['whitelabel/partner'].logo"
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
          class="maxw-40 text-left"
          v-if="isWhitelabel && pinnedWhitelabelSurveys.length > 0"
          :entities="pinnedWhitelabelSurveys"
          :title="`Pinned by ${whitelabelPartner.name}`"
          :link="e => `/surveys/${e.id}`"
        >
          <template v-slot:entity="{ entity }">
            <v-list-item-content>
              <div class="d-flex">
                <div class="mr-2">
                  <v-btn
                    v-if="entity.meta.submissions === 'public' || !entity.meta.submissions"
                    :to="`/surveys/${entity.id}`"
                    title="Everyone can submit"
                    icon
                  >
                    <v-icon>mdi-earth</v-icon>
                  </v-btn>
                  <v-btn
                    v-if="entity.meta.submissions === 'user'"
                    :to="`/surveys/${entity.id}`"
                    title="Only signed-in users can submit"
                    icon
                  >
                    <v-icon>mdi-account</v-icon>
                  </v-btn>
                  <v-btn
                    v-if="entity.meta.submissions === 'group'"
                    :to="`/surveys/${entity.id}`"
                    title="Everyone group members can submit"
                    icon
                  >
                    <v-icon>mdi-account-group</v-icon>
                  </v-btn>
                </div>
                <div>
                  <v-list-item-title>{{entity.name}}</v-list-item-title>
                  <v-list-item-subtitle>{{entity.group}}</v-list-item-subtitle>
                </div>
              </div>

            </v-list-item-content>
          </template>
        </app-basic-list>
      </v-col>
    </v-row>

    <v-row>
      <v-col align="center">
        <app-basic-list
          class="maxw-40 text-left"
          v-if="pinned && pinned.length > 0"
          :entities="pinned"
          title="Get started with your surveys!"
          :link="e => `/surveys/${e.id}`"
        >
          <template v-slot:entity="{ entity }">
            <v-list-item-content>
              <div class="d-flex">
                <div class="mr-2">
                  <v-btn
                    v-if="entity.meta.submissions === 'public' || !entity.meta.submissions"
                    :to="`/surveys/${entity.id}`"
                    title="Everyone can submit"
                    icon
                  >
                    <v-icon>mdi-earth</v-icon>
                  </v-btn>
                  <v-btn
                    v-if="entity.meta.submissions === 'user'"
                    :to="`/surveys/${entity.id}`"
                    title="Only signed-in users can submit"
                    icon
                  >
                    <v-icon>mdi-account</v-icon>
                  </v-btn>
                  <v-btn
                    v-if="entity.meta.submissions === 'group'"
                    :to="`/surveys/${entity.id}`"
                    title="Everyone group members can submit"
                    icon
                  >
                    <v-icon>mdi-account-group</v-icon>
                  </v-btn>
                </div>
                <div>
                  <v-list-item-title>{{entity.name}}</v-list-item-title>
                  <v-list-item-subtitle>{{entity.group}}</v-list-item-subtitle>
                </div>
              </div>

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
    isLoggedIn() {
      return this.$store.getters['auth/isLoggedIn'];
    },
    pinned() {
      const pinned = this.$store.getters['surveys/pinned'];
      return pinned;
    },
    isWhitelabel() {
      return this.$store.getters['whitelabel/isWhitelabel'];
    },
    whitelabelPartner() {
      return this.$store.getters['whitelabel/partner'];
    },
    pinnedWhitelabelSurveys() {
      return this.$store.getters['whitelabel/pinnedSurveys'];
    },
  },

  async created() {
    // const res = await axios.get('http://localhost:9095/measurement');
    // console.log('res', res);
  },
};
</script>
