<template>
  <nav>
    <v-app-bar app light clipped-left>
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-toolbar-title class="ml-2">Our-Sci</v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn v-if="$store.getters['auth/isLoggedIn']" :to="{name: 'auth-profile'}" text>
        <v-icon>mdi-account</v-icon>
      </v-btn>

      <v-btn v-else :to="{name: 'auth-login'}" text>
        <v-icon>mdi-login</v-icon>
        <span class="ml-2">Login</span>
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" app clipped>
      <v-list>
        <v-list-item v-for="(link, idx) in links" :key="idx" :to="link.to">
          <v-list-item-icon>
            <v-icon>{{link.icon}}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{link.title}}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
  </nav>
</template>

<script>
export default {
  data() {
    return {
      drawer: false,
      links: [
        {
          title: 'My Surveys',
          to: { name: 'my-surveys' },
          icon: 'mdi-clipboard',
        },
        {
          title: 'Browse',
          to: { name: 'browse-surveys' },
          icon: 'mdi-magnify',
        },
        {
          title: 'New Survey',
          to: {
            name: 'collect-survey-draft',
            params: { id: 'asdf' },
          },
          icon: 'mdi-newspaper-plus',
        },
        {
          title: 'Drafts',
          to: {
            name: 'browse-survey-drafts',
          },
          icon: 'mdi-pencil-plus',
        },
        {
          title: 'Builder',
          to: {
            name: 'survey-builder-new',
          },
          icon: 'mdi-newspaper-plus',
        },
      ],
    };
  },
};
</script>
