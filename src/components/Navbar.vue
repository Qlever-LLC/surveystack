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

      <v-menu
        offset-y
        v-if="$store.getters['auth/isLoggedIn']"
        :close-on-content-click="false"
      >
        <template v-slot:activator="{ on }">
            <!-- :to="{name: 'auth-profile'}" -->
          <v-btn
            text
            v-on="on"
          >
            <span class="d-none d-md-inline mr-1">{{$store.getters['auth/user'].email}}</span>
            <v-icon color="white">mdi-account</v-icon>
          </v-btn>
        </template>
        <!-- <v-card> -->
          <!-- <v-card-text> -->
            <!-- <v-list>
              <v-list-item v-for="group in ">
              </v-list-item>
            </v-list> -->
            <!-- <active-group-selector
              class="my-4"
              v-model="activeGroup"
              outlined
            /> -->
          <!-- </v-card-text> -->
          <!-- <v-card-title class="d-block pb-0"> -->
            <!-- <div class="text-center">

              <v-icon x-large>mdi-account</v-icon>
              <div class="">{{$store.getters['auth/user'].email}}</div>
            </div> -->

            <!-- View Profile
          </v-card-title> -->
          <!-- <v-card-text class="pt-0"> -->
            <v-list flat>
              <v-list-item link :to="{name: 'auth-profile'}">
                <v-list-item-icon>
                  <v-icon>mdi-account-circle</v-icon>
                </v-list-item-icon>
                <v-list-item-title>
                    Profile
                </v-list-item-title>
              </v-list-item>
              <v-list-item link :to="{name: 'users-edit', params: { id: this.$store.state.auth.user._id }}">
                <v-list-item-icon>
                  <v-icon>mdi-account-edit</v-icon>
                </v-list-item-icon>
                <v-list-item-title>
                    Edit Account
                </v-list-item-title>
              </v-list-item>
              <active-group-selector-list
                class=""
                v-model="activeGroup"
              />
              <!-- <v-divider /> -->
              <v-list-item
                link
                @click="logout"
                class="mt-2"
              >
                <v-list-item-icon>
                  <v-icon>mdi-logout-variant</v-icon>
                </v-list-item-icon>
                <v-list-item-title>
                    Sign Out
                </v-list-item-title>
              </v-list-item>
            </v-list>

          <!-- </v-card-text> -->
        <!-- </v-card> -->
      </v-menu>

      <v-btn
        v-else
        :to="{name: 'auth-login'}"
        text
      >
        <v-icon>mdi-login-variant</v-icon>
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
// import ActiveGroupSelector from '@/components/shared/ActiveGroupSelector.vue';
import ActiveGroupSelectorList from '@/components/shared/ActiveGroupSelectorList.vue';

export default {
  components: {
    // ActiveGroupSelector,
    ActiveGroupSelectorList,
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
    activeGroup: {
      get() {
        return this.$store.getters['memberships/activeGroup'];
      },
      set(val) {
        this.$store.dispatch('memberships/setActiveGroup', val);
      },
    },
  },
  methods: {
    async logout() {
      this.$store.dispatch('auth/logout');
      this.$router.push('/auth/login');
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
