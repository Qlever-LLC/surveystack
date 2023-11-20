<template>
  <v-navigation-drawer :value="value" app>
    <div class="d-flex justify-end mt-3 mr-3">
      <v-btn large icon @click="$emit('input', !value)">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>
    <v-list class="mt-0 pt-0">
      <template v-for="(item, i) in items">
        <v-divider v-if="item.type === 'divider'" :key="i" dark class="my-1" />
        <v-subheader v-else-if="item.type === 'subheader'" :key="i">{{ item.label }}</v-subheader>
        <v-list-item v-else :key="i" :to="item.to">
          <v-list-item-icon v-if="item.icon" :class="item.class">
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              {{ item.label }}
              <a-chip
                v-if="item.to && item.to.name && item.to.name === 'my-submissions' && readyToSubmitCount"
                color="accent"
                small
              >
                {{ readyToSubmitCount }}
              </a-chip>
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </template>

      <v-divider dark class="my-1" />

      <v-list-item class="pa-0">
        <v-expansion-panels class="pa-0 ma-0 no-background" flat accordion :value="docs.length > 2 ? undefined : 0">
          <v-expansion-panel>
            <v-expansion-panel-header class="pa-0 ma-0">
              <v-subheader>DOCUMENTATION</v-subheader>
            </v-expansion-panel-header>
            <v-expansion-panel-content class="pa-0 ma-0 no-padding">
              <v-list class="pa-0 ma-0">
                <v-list-item v-for="(doc, index) in docs" :key="doc.link + index" :href="doc.link" target="_blank">
                  <v-list-item-icon>
                    <v-icon>mdi-notebook</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>{{ doc.label }}</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>

                <v-list-item href="https://our-sci.gitlab.io/software/surveystack_tutorials/" target="_blank">
                  <v-list-item-icon>
                    <v-icon>mdi-help-circle-outline</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>SurveyStack Help</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
                <v-list-item href="https://www.surveystack.io" target="_blank">
                  <v-list-item-icon>
                    <v-icon>mdi-information-outline</v-icon>
                  </v-list-item-icon>
                  <v-list-item-content>
                    <v-list-item-title>About</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-list-item>
    </v-list>

    <template v-slot:append>
      <div dark class="grey--text">
        <p class="pt-4 pl-4">
          Version:
          <router-link to="/app/info" class="decoration-none">{{ lcl.shortHash }}</router-link>
        </p>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script>
export default {
  props: {
    value: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    let groupsLink = { name: 'groups-list' };
    if (this.$store.getters['whitelabel/isWhitelabel']) {
      groupsLink = `/g${this.$store.getters['whitelabel/partner'].path}`;
    }

    return {
      drawerIsVisible: false,
      lcl: JSON.parse(process.env.VUE_APP_LCL),
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
          {
            type: 'link',
            label: 'FarmOS',
            to: {
              name: 'farmos-manage',
            },
            icon: 'mdi-leaf-circle-outline',
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
  },
};
</script>
