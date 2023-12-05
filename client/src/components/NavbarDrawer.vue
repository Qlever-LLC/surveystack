<template>
  <a-navigation-drawer :modelValue="modelValue">
    <div class="d-flex justify-end mt-3 mr-3">
      <a-btn large icon @click="closeNavBar">
        <a-icon>mdi-close</a-icon>
      </a-btn>
    </div>
    <a-list>
      <div v-for="(item, i) in items" :key="i">
        <a-divider v-if="item.type === 'divider'" dark class="my-1" />
        <a-list-subheader v-else-if="item.type === 'subheader'">{{ item.label }}</a-list-subheader>
        <a-list-item v-else :to="item.to" :prepend-icon="item.icon">
          <a-list-item-title>
            {{ item.label }}
            <a-chip
              v-if="item.to && item.to.name && item.to.name === 'my-submissions' && readyToSubmitCount"
              color="accent"
              small
            >
              {{ readyToSubmitCount }}
            </a-chip>
          </a-list-item-title>
        </a-list-item>
      </div>

      <a-divider dark class="my-1" />

      <a-list-item class="pa-0">
        <a-expansion-panels class="pa-0 ma-0 no-background" flat accordion :value="docs.length > 2 ? undefined : 0">
          <a-expansion-panel>
            <a-expansion-panel-title class="pa-0 ma-0">
              <a-list-subheader>DOCUMENTATION</a-list-subheader>
            </a-expansion-panel-title>
            <a-expansion-panel-text class="pa-0 ma-0 no-padding">
              <a-list class="pa-0 ma-0">
                <a-list-item
                  v-for="(doc, index) in docs"
                  :key="doc.link + index"
                  :href="doc.link"
                  target="_blank"
                  prepend-icon="mdi-notebook"
                >
                  <a-list-item-title>{{ doc.label }}</a-list-item-title>
                </a-list-item>

                <a-list-item
                  href="https://our-sci.gitlab.io/software/surveystack_tutorials/"
                  target="_blank"
                  prepend-icon="mdi-help-circle-outline"
                >
                  <a-list-item-title>SurveyStack Help</a-list-item-title>
                </a-list-item>
                <v-list-item href="https://www.surveystack.io" target="_blank" prepend-icon="mdi-information-outline">
                  <a-list-item-title>About</a-list-item-title>
                </v-list-item>
              </a-list>
            </a-expansion-panel-text>
          </a-expansion-panel>
        </a-expansion-panels>
      </a-list-item>
    </a-list>

    <template v-slot:append>
      <div dark class="text-grey">
        <p class="pt-4 pl-4">
          Version:
          <router-link to="/app/info" class="decoration-none">{{ lcl.shortHash }}</router-link>
        </p>
      </div>
    </template>
  </a-navigation-drawer>
</template>

<script>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

export default {
  emits: ['update:modelValue'],
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
  },

  setup(props, { emit }) {
    const store = useStore();

    let groupsLink = { name: 'groups-list' };
    if (store.getters['whitelabel/isWhitelabel']) {
      groupsLink = `/g${store.getters['whitelabel/partner'].path}`;
    }

    const lcl = JSON.parse(process.env.VUE_APP_LCL);
    const sidenav = {
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
    };

    const readyToSubmitCount = computed(() => {
      return store.getters['submissions/readyToSubmit'].length;
    });

    const items = computed(() => {
      const items = [];
      const divider = { type: 'divider' };
      items.push(...sidenav.collect);
      if (store.getters['auth/isLoggedIn']) {
        items.push(divider);
        items.push(...sidenav.admin);
      }
      if (store.getters['auth/isSuperAdmin']) {
        items.push(divider);
        items.push(...sidenav.superAdmin);
      }
      return items;
    });

    const groups = computed(() => {
      return store.getters['memberships/groups'];
    });

    const activeGroupId = computed(() => {
      return store.getters['memberships/activeGroup'];
    });

    const docs = computed(() => {
      const docs = new Map();
      // add all docs of all groups to a map to make them distinct
      groups.value.forEach((group) => {
        if (group._id === activeGroupId.value && group.docs) {
          group.docs.forEach((doc) => {
            docs.set(doc.label + doc.link, doc);
          });
        }
      });
      return Array.from(docs.values());
    });

    // Methods
    const closeNavBar = () => {
      console.log('closeNavBar');
      emit('update:modelValue', !props.modelValue);
    };

    return {
      lcl,
      readyToSubmitCount,
      items,
      docs,
      closeNavBar,
    };
  },
};
</script>
