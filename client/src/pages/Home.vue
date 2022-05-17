<template>
  <v-container class="home" :fluid="true">
    <v-row>
      <v-col>
        <v-img
          v-if="isWhitelabel"
          :src="$store.getters['whitelabel/partner'].hero || $store.getters['whitelabel/partner'].logo"
          class="my-3"
          contain
          height="128"
        ></v-img>
        <v-img v-else :src="require('../assets/logo-green-stacked.svg')" class="my-3" contain height="128"></v-img>
      </v-col>
    </v-row>

    <v-row>
      <v-col align="center">
        <app-basic-list
          class="maxw-40 text-left"
          v-if="isWhitelabel && pinnedWhitelabelSurveys.length > 0"
          :entities="pinnedWhitelabelSurveys"
          title="Get Started"
          :link="(e) => `/surveys/${e.id}`"
          :searchable="false"
        >
          <template v-slot:entity="{ entity }">
            <v-list-item-icon class="mr-2 d-flex align-center mb-2">
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
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>{{ entity.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ entity.group }}</v-list-item-subtitle>
            </v-list-item-content>
            <div class="d-flex align-center ml-3">
              <v-btn color="primary" small>Take Survey</v-btn>
            </div>
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
          title="More Surveys"
          :link="(e) => `/surveys/${e.id}`"
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
                  <v-list-item-title>{{ entity.name }}</v-list-item-title>
                  <v-list-item-subtitle>{{ entity.group }}</v-list-item-subtitle>
                </div>
              </div>
            </v-list-item-content>
          </template>
        </app-basic-list>
      </v-col>
    </v-row>

    <v-dialog v-if="!isLoggedIn" v-model="loginIsVisible" class="login-dialog">
      <auth-selector />
    </v-dialog>

    <v-row>
      <v-col align="center">
        <v-btn x-large text :to="`/surveys/browse`">
          <v-icon left>mdi-text-box-search-outline</v-icon>Browse All Surveys
        </v-btn>
      </v-col>
    </v-row>

    <v-row v-if="false">
      <v-col align="center">
        <v-btn color="primary" x-large href="surveystack://measurement">Run Measurement</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import AuthSelector from '@/components/ui/AuthSelector.vue';
import AppBasicList from '@/components/ui/BasicList.vue';

export default {
  components: {
    AuthSelector,
    AppBasicList,
  },
  name: 'home',
  data() {
    return {
      loginIsVisible: this.$store.getters['auth/isLoggedIn'] || true,
    };
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
};
</script>

<style scoped>
.home {
  background-color: var(--v-background-base);
  height: 100%;
}

>>> .v-dialog {
  height: auto;
  width: auto;
  max-width: 40rem;
}

>>> .container {
  padding: 0;
}
</style>
