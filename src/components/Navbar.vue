<template>
  <nav>
    <v-app-bar
      app
      clipped-left
      color="appbar"
    >
      <!-- color="white" -->
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-toolbar-title class="ml-2 flex-column">
        <div
          id="app-bar-title"
          class="title py-0 my-0"
        >
          <router-link
            to="/"
            id="home-link"
            v-html="appTitle"
          />
        </div>
        <div
          class="app-bar-subtitle subtitle py-0 my-0"
          v-html="appSubtitle"
        />
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
          >
            {{item.label}}
          </v-subheader>
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
              <!-- <v-list-item-title
                v-if="item.to && item.to.name && item.to.name === 'my-submissions' && readyToSubmitCount"
              >
                <v-badge :content="readyToSubmitCount" color="pink">
                  {{ item.label }}
                </v-badge>
              </v-list-item-title> -->
              <!-- <v-list-item-title v-else>
                {{ item.label }}
              </v-list-item-title> -->
              <v-list-item-title>
                {{ item.label }}
                <v-chip
                  v-if="item.to && item.to.name && item.to.name === 'my-submissions' && readyToSubmitCount"
                  color="accent"
                  small
                >
                  {{readyToSubmitCount}}
                </v-chip>
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </template>

      </v-list>

      <template v-slot:append>
        <div
          dark
          class="grey--text"
        >
          <p class="pt-4 pl-4">App-Version: <router-link
              to="/app/info"
              class="decoration-none"
            >{{ version }}</router-link>
          </p>
        </div>
      </template>

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
      version: process.env.VUE_APP_VERSION,
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
        ],
        superAdmin: [
          {
            type: 'subheader',
            label: 'SUPER-ADMIN',
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
    readyToSubmitCount() {
      return this.$store.getters['submissions/readyToSubmit'].length;
    },
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
      if (this.$store.getters['auth/isSuperAdmin']) {
        items.push(divider);
        items.push(...this.sidenav.superAdmin);
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
</style>
