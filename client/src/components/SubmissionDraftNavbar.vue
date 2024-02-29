<template>
  <nav class="app-navbar">
    <navbar-drawer v-model="drawerIsVisible" />
    <a-app-bar color="appbar" absolute>
      <a-app-bar-nav-icon @click="drawerIsVisible = !drawerIsVisible" />
      <a-toolbar-title class="flex-column flex-grow-1">
        <draft-toolbar
          :groupPath="groupPath"
          :required="control && control.options && control.options.required"
          :anon="control && control.options && control.options.redacted"
          :showOverviewIcon="true"
          :questionNumber="questionNumber"
          @showOverviewClicked="showOverview = !showOverview" />
      </a-toolbar-title>

      <navbar-user-menu />
    </a-app-bar>
  </nav>
</template>

<script>
import DraftToolbar from '@/components/survey/drafts/DraftToolbar.vue';
import NavbarDrawer from '@/components/AppNavigationGlobal.vue';
import NavbarUserMenu from '@/components/NavbarUserMenu.vue';

import { queueAction } from '@/utils/surveyStack';

export default {
  components: {
    DraftToolbar,
    NavbarDrawer,
    NavbarUserMenu,
  },
  computed: {
    drawerIsVisible: {
      get() {
        return this.$store.getters['appui/menu'];
      },
      set(value) {
        this.$store.dispatch('appui/setMenu', value);
      },
    },
    control() {
      return this.$store.getters['draft/control'];
    },
    questionNumber() {
      return this.$store.getters['draft/questionNumber'];
    },
    groupPath() {
      return this.$store.getters['draft/groupPath'];
    },
    showOverview: {
      get() {
        return this.$store.getters['draft/showOverview'];
      },
      set(v) {
        // this.$store.dispatch('draft/showOverview', v);
        queueAction(this.$store, 'draft/showOverview', v);
      },
    },
  },
};
</script>
<style scoped lang="scss">
.title {
  font-size: 1rem !important;
}

#app-bar-title {
  font-size: 1rem;
  font-weight: normal;
  /* color: white; */
  line-height: 1.8rem;
}

.subtitle {
  font-size: 0.8rem;
  line-height: 0.8rem;
}
</style>
<style>
.app-bar-subtitle span {
  vertical-align: middle;
}

.decoration-none {
  text-decoration: none;
}

#home-link {
  text-decoration: none;
  color: rgba(0, 0, 0, 0.87);
}

.no-padding .v-expansion-panel-content__wrap {
  padding: 0;
}

.no-background.theme--light.v-expansion-panels .v-expansion-panel {
  background-color: rgba(0, 0, 0, 0);
}
</style>
