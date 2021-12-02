<template>
  <nav class="app-navbar">
    <v-app-bar app clipped-left color="appbar" absolute>
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-toolbar-title class="flex-column">
        <div id="app-bar-title" class="title py-0 my-0">
          <router-link to="/" id="home-link" v-html="appTitle" />
        </div>
        <div class="app-bar-subtitle subtitle py-0 my-0" v-html="appSubtitle" />
      </v-toolbar-title>

      <v-spacer></v-spacer>
      <navbar-user-menu />
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" app color="sidenavbackground">
      <div class="d-flex justify-space-between w-full">
        <img v-if="isWhitelabel" :src="$store.getters['whitelabel/partner'].logo" class="my-3 mx-4" height="30" />
        <img v-if="!isWhitelabel" src="../assets/surveystack_temp_logo.svg" class="my-3 mx-4" height="30" />
        <v-btn large icon @click="drawer = !drawer">
          <v-icon class="sidenavcolor--text">mdi-close</v-icon>
        </v-btn>
      </div>
      <v-list class="mt-0 pt-0">
        <template v-for="(item, i) in items">
          <v-divider v-if="item.type === 'divider'" :key="i" dark class="my-1" />
          <v-subheader v-else-if="item.type === 'subheader'" :key="i" class="sidenavcolor--text">
            {{ item.label }}
          </v-subheader>
          <v-list-item v-else :key="i" :to="item.to">
            <v-list-item-icon v-if="item.icon" :class="item.class">
              <v-icon class="sidenavcolor--text">{{ item.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title class="sidenavcolor--text">
                {{ item.label }}
                <v-chip
                  v-if="item.to && item.to.name && item.to.name === 'my-submissions' && readyToSubmitCount"
                  color="accent"
                  small
                >
                  {{ readyToSubmitCount }}
                </v-chip>
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </template>

        <v-divider dark class="my-1" />

        <v-list-item class="pa-0">
          <v-expansion-panels class="pa-0 ma-0 no-background" flat accordion :value="docs.length > 2 ? undefined : 0">
            <v-expansion-panel>
              <v-list class="pa-0 ma-0">
                <v-list-item v-for="(doc, index) in docs" :key="doc.link + index" :href="doc.link" target="_blank">
                  <v-list-item-icon>
                    <v-icon class="sidenavcolor--text">mdi-notebook</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title class="sidenavcolor--text">{{ doc.label }}</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item href="https://our-sci.gitlab.io/software/surveystack_tutorials/" target="_blank">
                  <v-list-item-icon>
                    <v-icon class="sidenavcolor--text">mdi-notebook-multiple</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title class="sidenavcolor--text">SurveyStack Docs</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-list-item>
      </v-list>

      <template v-slot:append>
        <div dark class="sidenavcolor--text">
          <p class="pt-4 pl-4">
            App-Version:
            <router-link to="/app/info" class="decoration-none sidenavcolor--text">{{ version }} </router-link>
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
    let groupsLink = { name: 'groups-list' };
    if (this.$store.getters['whitelabel/isWhitelabel']) {
      groupsLink = `/g${this.$store.getters['whitelabel/partner'].path}`;
    }

    return {
      version: process.env.VUE_APP_VERSION,
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
            /*
            to: {
              name: 'groups-list',
            },
            */
            to: groupsLink,
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
    drawer: {
      get() {
        return this.$store.getters['appui/menu'];
      },
      set(value) {
        this.$store.dispatch('appui/setMenu', value);
      },
    },
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
    docs() {
      const groups = this.$store.getters['memberships/groups'];
      const activeGroupId = this.$store.getters['memberships/activeGroup'];

      const docs = new Map();
      // add all docs of all groups to a map to make them distinct
      groups.forEach((group) => {
        if (group._id === activeGroupId && group.docs) {
          group.docs.forEach((doc) => {
            docs.set(doc.label + doc.link, doc);
          });
        }
      });
      return Array.from(docs.values());
    },
    isWhitelabel() {
      return this.$store.getters['whitelabel/isWhitelabel'];
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
