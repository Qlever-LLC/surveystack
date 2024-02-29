<template>
  <a-container class="home align-center" fluid>
    <div class="d-flex justify-center align-center">
      <a-card color="accent" class="ma-6 pa-6 align-center" style="max-width: 300px">
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
      <a-card color="accent" class="ma-6 pa-6" style="max-width: 300px">
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
    </div>
  </a-container>
</template>

<script>
import AuthSelector from '@/components/ui/AuthSelector.vue';
import AppBasicList from '@/components/ui/BasicList.vue';
import ACardTitle from '@/components/ui/elements/ACardTitle.vue';

export default {
  components: {
    ACardTitle,
    AuthSelector,
    AppBasicList,
  },
  name: 'home',
  data() {
    return {
      loginIsVisible: this.$store.getters['auth/isLoggedIn'] || true,
    };
  },
  methods: {
    getIcon(e) {
      if (e.pinned) {
        return 'mdi-pin';
      } else if (e.meta.submissions === 'public' || !e.meta.submissions) {
        return 'mdi-earth';
      } else if (e.meta.submissions === 'user') {
        return 'mdi-account';
      } else if (e.meta.submissions === 'group') {
        return 'mdi-account-group';
      }
    },
    getTitle(e) {
      if (e.meta.submissions === 'public' || !e.meta.submissions) {
        return 'Everyone can submit';
      } else if (e.meta.submissions === 'user') {
        return 'Only signed-in users can submit';
      } else if (e.meta.submissions === 'group') {
        return 'Everyone group members can submit';
      }
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
};
</script>

<style scoped lang="scss">
.home {
  height: 100%;
}

>>> .container {
  padding: 0;
}
</style>
