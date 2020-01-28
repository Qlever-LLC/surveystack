<template>
  <nav>
    <v-app-bar app light clipped-left color="#f44336ff">
      <v-app-bar-nav-icon color="white" @click="drawer = !drawer" />
      <v-toolbar-title class="ml-2">
        <span class="title">Our-Sci</span>
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn v-if="$store.getters['auth/isLoggedIn']" :to="{name: 'auth-profile'}" text>
        <v-icon color="white">mdi-account</v-icon>
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
          to: { name: 'surveys-browse' },
          icon: 'mdi-magnify',
        },
        {
          title: 'Drafts',
          to: { name: 'submissions-drafts-list' },
          icon: 'mdi-pencil-plus',
        },
        {
          title: 'Builder',
          to: { name: 'surveys-new' },
          icon: 'mdi-newspaper-plus',
        },
        {
          title: 'Mock Survey',
          to: { name: 'mock' },
          icon: 'mdi-newspaper-plus',
        },
        {
          title: 'Experiment',
          to: {
            name: 'experiment-questions',
          },
          icon: 'mdi-pill',
        },
        {
          title: 'Users',
          to: {
            name: 'users-list',
          },
          icon: 'mdi-account-group',
        },
        {
          title: 'Tabula Rasa',
          to: {
            name: 'tabula-rasa',
          },
          icon: 'mdi-delete-variant',
        },
      ],
    };
  },
};
</script>
<style scoped>
.title {
  color: white;
}
</style>
