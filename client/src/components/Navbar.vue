<template>
  <nav class="app-navbar">
    <v-app-bar app clipped-left color="appbar" absolute>
      <v-app-bar-nav-icon @click="drawerIsVisible = !drawerIsVisible" />
      <a-toolbar-title class="flex-column">
        <div id="app-bar-title" class="title py-0 my-0">
          <router-link to="/" id="home-link" v-html="appTitle" />
        </div>
        <div class="app-bar-subtitle subtitle py-0 my-0" v-html="appSubtitle" />
      </a-toolbar-title>

      <a-spacer />
      <offline-indicator />
      <v-btn class="help-btn" text href="https://our-sci.gitlab.io/software/surveystack_tutorials/" target="_blank">
        <a-icon size="22">mdi-help-circle-outline</a-icon>
      </v-btn>
      <navbar-user-menu />
    </v-app-bar>
    <navbar-drawer v-model="drawerIsVisible" />
  </nav>
</template>

<script>
import NavbarUserMenu from '@/components/NavbarUserMenu.vue';
import NavbarDrawer from '@/components/NavbarDrawer.vue';
import OfflineIndicator from '@/components/ui/OfflineIndicator.vue';
import AIcon from '@/components/ui/AIcon.vue';

export default {
  components: {
    AIcon,
    OfflineIndicator,
    NavbarUserMenu,
    NavbarDrawer,
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
    appTitle() {
      return this.$store.getters['appui/title'];
    },
    appSubtitle() {
      return this.$store.getters['appui/subtitle'];
    },
  },
};
</script>
<style scoped>
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

.help-btn.v-btn:not(.v-btn--round).v-size--default {
  min-width: 0px;
  padding: 0px 8px;
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
