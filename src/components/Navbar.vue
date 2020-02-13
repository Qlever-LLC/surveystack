<template>
  <nav>
    <v-app-bar
      app
      dark
      clipped-left
      color="#f44336ff"
    >
      <v-app-bar-nav-icon
        color="white"
        @click="drawer = !drawer"
      />
      <v-toolbar-title class="ml-2 flex-column">
        <div
          id="app-bar-title"
          class="title py-0 my-0"
        >{{ appTitle }}</div>
        <div
          class="app-bar-subtitle subtitle py-0 my-0"
          v-html="appSubtitle"
        ></div>
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <v-btn
        v-if="$store.getters['auth/isLoggedIn']"
        :to="{name: 'auth-profile'}"
        text
      >
        <v-icon color="white">mdi-account</v-icon>
      </v-btn>

      <v-btn
        v-else
        :to="{name: 'auth-login'}"
        text
      >
        <v-icon>mdi-login</v-icon>
        <span class="ml-2">Login</span>
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      app
      clipped
    >
      <v-list>
        <template v-for="(item, i) in items">
          <v-divider
            v-if="item.divider"
            :key="i"
            dark
            class="my-3"
          />
          <v-list-item
            v-else
            :key="i"
            :to="item.to"
          >
            <v-list-item-icon
              v-if="item.icon"
              :class="item.class"
            >
              <v-icon>{{item.icon}}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>{{item.title}}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </template>

      </v-list>
    </v-navigation-drawer>
  </nav>
</template>

<script>
export default {
  data() {
    return {
      drawer: false,
      items: [
        {
          title: 'My Submissions',
          to: { name: 'my-surveys' },
          icon: 'mdi-clipboard',
        },
        {
          title: 'Browse',
          to: { name: 'surveys-browse' },
          icon: 'mdi-magnify',
        },
        {
          title: 'Builder',
          to: { name: 'surveys-new' },
          icon: 'mdi-newspaper-plus',
        },
        {
          title: 'Scripts',
          to: { name: 'scripts-list' },
          icon: 'mdi-language-javascript',
        },
        {
          title: 'Groups',
          to: {
            name: 'groups-list',
          },
          icon: 'mdi-domain',
        },
        {
          title: 'Users',
          to: {
            name: 'users-list',
          },
          icon: 'mdi-account-search',
        },

        {
          title: 'Tabula Rasa',
          to: {
            name: 'tabula-rasa',
          },
          icon: 'mdi-delete-variant',
        },
        {
          divider: true,
        },
        {
          title: 'Experiment',
          to: {
            name: 'experiment',
          },
          icon: 'mdi-pill',
        },
        {
          title: 'Andreas',
          to: {
            name: 'experiment-ar',
          },
          icon: 'mdi-alpha-a',
          class: 'ml-3',
        },
        {
          title: 'Manuel',
          to: {
            name: 'experiment-mdc',
          },
          icon: 'mdi-alpha-m',
          class: 'ml-3',
        },
        {
          title: 'Will',
          to: {
            name: 'experiment-wg',
          },
          icon: 'mdi-alpha-w',
          class: 'ml-3',
        },
        {
          divider: true,
        },
      ],
    };
  },
  computed: {
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
#app-bar-title {
  font-size: 1rem;
  font-weight: normal;
  color: white;
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
</style>
