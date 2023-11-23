<template>
  <a-container class="home" fluid>
    <a-row>
      <a-col>
        <a-img
          v-if="isWhitelabel"
          :src="$store.getters['whitelabel/partner'].hero || $store.getters['whitelabel/partner'].logo"
          class="my-3"
          contain
          height="128"
        />
        <a-img v-else :src="require('../assets/logo-green-stacked.svg')" class="my-3" contain height="128" />
      </a-col>
    </a-row>

    <a-row>
      <a-col align="center">
        <app-basic-list
          class="maxw-40 text-left"
          v-if="isWhitelabel && pinnedWhitelabelSurveys.length > 0"
          :entities="pinnedWhitelabelSurveys"
          title="Get Started"
          :link="(e) => `/surveys/${e.id}`"
          :searchable="false"
        >
          <template v-slot:entity="{ entity }">
            <a-list-item-icon class="mr-2 d-flex align-center mb-2">
              <a-btn
                v-if="entity.meta.submissions === 'public' || !entity.meta.submissions"
                :to="`/surveys/${entity.id}`"
                title="Everyone can submit"
                icon
              >
                <a-icon>mdi-earth</a-icon>
              </a-btn>
              <a-btn
                v-if="entity.meta.submissions === 'user'"
                :to="`/surveys/${entity.id}`"
                title="Only signed-in users can submit"
                icon
              >
                <a-icon>mdi-account</a-icon>
              </a-btn>
              <a-btn
                v-if="entity.meta.submissions === 'group'"
                :to="`/surveys/${entity.id}`"
                title="Everyone group members can submit"
                icon
              >
                <a-icon>mdi-account-group</a-icon>
              </a-btn>
            </a-list-item-icon>
            <v-list-item-content>
              <a-list-item-title>{{ entity.name }}</a-list-item-title>
              <a-list-item-subtitle>{{ entity.group }}</a-list-item-subtitle>
            </v-list-item-content>
            <div class="d-flex align-center ml-3">
              <a-btn color="primary" small>Take Survey</a-btn>
            </div>
          </template>
        </app-basic-list>
      </a-col>
    </a-row>

    <a-row>
      <a-col align="center">
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
                  <a-btn
                    v-if="entity.meta.submissions === 'public' || !entity.meta.submissions"
                    :to="`/surveys/${entity.id}`"
                    title="Everyone can submit"
                    icon
                  >
                    <a-icon>mdi-earth</a-icon>
                  </a-btn>
                  <a-btn
                    v-if="entity.meta.submissions === 'user'"
                    :to="`/surveys/${entity.id}`"
                    title="Only signed-in users can submit"
                    icon
                  >
                    <a-icon>mdi-account</a-icon>
                  </a-btn>
                  <a-btn
                    v-if="entity.meta.submissions === 'group'"
                    :to="`/surveys/${entity.id}`"
                    title="Everyone group members can submit"
                    icon
                  >
                    <a-icon>mdi-account-group</a-icon>
                  </a-btn>
                </div>
                <div>
                  <a-list-item-title>{{ entity.name }}</a-list-item-title>
                  <a-list-item-subtitle>{{ entity.group }}</a-list-item-subtitle>
                </div>
              </div>
            </v-list-item-content>
          </template>
        </app-basic-list>
      </a-col>
    </a-row>

    <a-dialog v-if="!isLoggedIn" v-model="loginIsVisible" class="login-dialog" cssLoginPage>
      <auth-selector />
    </a-dialog>

    <a-row>
      <a-col align="center">
        <a-btn x-large text :to="`/surveys/browse`">
          <a-icon left>mdi-text-box-search-outline</a-icon>Browse All Surveys
        </a-btn>
      </a-col>
    </a-row>

    <a-row v-if="false">
      <a-col align="center">
        <a-btn color="primary" x-large href="surveystack://measurement">Run Measurement</a-btn>
      </a-col>
    </a-row>
  </a-container>
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

>>> .container {
  padding: 0;
}
</style>
