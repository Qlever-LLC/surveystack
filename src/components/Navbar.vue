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
      <navbar-user-menu />

    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      app
      clipped
    >
      <v-list>
        <template v-for="(item, i) in items">
          <v-divider
            v-if="item.type === 'divider'"
            :key="i"
            dark
            class="my-1"
          />
          <v-subheader
            v-else-if="item.type === 'subheader'"
            :key="i"
          >{{item.label}}</v-subheader>
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
              <v-list-item-title>{{item.label}}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </template>

      </v-list>

    </v-navigation-drawer>
  </nav>
</template>

<script>
import NavbarUserMenu from '@/components/NavbarUserMenu.vue';

export default {
  components: {
    NavbarUserMenu,
  },
  data() {
    return {
      drawer: false,
      sidenav: {
        collect: [
          {
            type: 'subheader',
            label: 'COLLECT',
          },
          {
            type: 'link',
            label: 'My Submissions',
            to: { name: 'my-submissions' },
            icon: 'mdi-clipboard',
          },
          {
            type: 'link',
            label: 'Browse',
            to: { name: 'surveys-browse' },
            icon: 'mdi-magnify',
          },
        ],
        admin: [
          {
            type: 'subheader',
            label: 'ADMIN',
          },
          {
            type: 'link',
            label: 'Builder',
            to: { name: 'surveys-new' },
            icon: 'mdi-newspaper-plus',
          },
          {
            type: 'link',
            label: 'Scripts',
            to: { name: 'scripts-list' },
            icon: 'mdi-language-javascript',
          },
          {
            type: 'link',
            label: 'Groups',
            to: {
              name: 'groups-list',
            },
            icon: 'mdi-domain',
          },
          {
            type: 'link',
            label: 'Users',
            to: {
              name: 'users-list',
            },
            icon: 'mdi-account-search',
          },
        ],
        dev: [
          {
            type: 'subheader',
            label: 'DEBUG',
          },
          {
            type: 'link',
            label: 'Tabula Rasa',
            to: {
              name: 'tabula-rasa',
            },
            icon: 'mdi-delete-variant',
          },
          {
            type: 'link',
            label: 'Experiment',
            to: {
              name: 'experiment',
            },
            icon: 'mdi-pill',
          },
          {
            type: 'link',
            label: 'Andreas',
            to: {
              name: 'experiment-ar',
            },
            icon: 'mdi-alpha-a',
            class: 'ml-3',
          },
          {
            type: 'link',
            label: 'Manuel',
            to: {
              name: 'experiment-mdc',
            },
            icon: 'mdi-alpha-m',
            class: 'ml-3',
          },
          {
            type: 'link',
            label: 'Will',
            to: {
              name: 'experiment-wg',
            },
            icon: 'mdi-alpha-w',
            class: 'ml-3',
          },
        ],
      },
    };
  },
  computed: {
    appTitle() {
      return this.$store.getters['appui/title'];
    },
    appSubtitle() {
      return this.$store.getters['appui/subtitle'];
    },
    items() {
      const items = [];
      const divider = { type: 'divider' };
      items.push(...this.sidenav.collect);
      if (this.$store.getters['auth/isLoggedIn']) {
        items.push(divider);
        items.push(...this.sidenav.admin);
      }
      // items.push(divider);
      // items.push(...this.sidenav.dev);
      return items;
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
