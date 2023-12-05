<template>
  <a-container class="home" fluid>
    <a-row>
      <a-col>
        <a-img
          v-if="isWhitelabel"
          :src="whitelabelPartner.hero || whitelabelPartner.logo"
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
            <a-list-item class="d-flex" :to="`/surveys/${entity.id}`">
              <template #prepend>
                <a-icon
                  v-if="entity.meta.submissions === 'public' || !entity.meta.submissions"
                  icon="mdi-earth"
                  title="Everyone can submit"
                />
                <a-icon
                  v-if="entity.meta.submissions === 'user'"
                  icon="mdi-account"
                  title="Only signed-in users can submit"
                />
                <a-icon
                  v-if="entity.meta.submissions === 'group'"
                  icon="mdi-account-group"
                  title="Everyone group members can submit"
                />
              </template>
              <template #default>
                <div>
                  <a-list-item-title>{{ entity.name }}</a-list-item-title>
                  <a-list-item-subtitle>{{ entity.group }}</a-list-item-subtitle>
                </div>
                <div class="d-flex align-center ml-3">
                  <a-btn color="primary" small>Take Survey</a-btn>
                </div>
              </template>
            </a-list-item>
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
            <a-list-item class="d-flex" :to="`/surveys/${entity.id}`" @click="$emit('test')">
              <template #prepend>
                <a-icon
                  v-if="entity.meta.submissions === 'public' || !entity.meta.submissions"
                  icon="mdi-earth"
                  title="Everyone can submit"
                />
                <a-icon
                  v-if="entity.meta.submissions === 'user'"
                  icon="mdi-account"
                  title="Only signed-in users can submit"
                />
                <a-icon
                  v-if="entity.meta.submissions === 'group'"
                  icon="mdi-account-group"
                  title="Everyone group members can submit"
                />
              </template>
              <a-list-item-title>{{ entity.name }}</a-list-item-title>
              <a-list-item-subtitle>{{ entity.group }}</a-list-item-subtitle>
            </a-list-item>
          </template>
        </app-basic-list>
      </a-col>
    </a-row>

    <a-dialog v-if="!isLoggedIn" v-model="loginIsVisible" class="login-dialog" cssLoginPage>
      <auth-selector />
    </a-dialog>

    <a-row>
      <a-col align="center">
        <a-btn x-large variant="text" :to="`/surveys/browse`">
          <a-icon left>mdi-text-box-search-outline</a-icon>
          Browse All Surveys
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
  background-color: rgb(var(--v-theme-background));
  height: 100%;
}

>>> .container {
  padding: 0;
}
</style>
