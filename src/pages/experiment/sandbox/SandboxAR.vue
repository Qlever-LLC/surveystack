<template>
  <v-container>
    <a
      class="body-2"
      :href="apiUrl"
      target="_blank"
    >{{apiUrl}}</a>
    <v-row>
      <v-col>
        <v-card>
          <v-list>
            <v-list-item
              v-for="e in tree"
              :key="e._id"
              :to="`/g${e.group.path}`"
            >
              <v-list-item-content :class="`ml-${getIndentation(e.group.path) * 2}`">
                <v-list-item-title>
                  {{e.group.name}}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{e.group.path}}
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
      <v-col>
        <app-json-editor
          v-model="tree"
          :rows="16"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import api from '@/services/api.service';
import appJsonEditor from '@/components/ui/JsonEditor.vue';


export default {
  components: {
    appJsonEditor,
  },
  data() {
    return {
      tree: [],
    };
  },
  methods: {
    getIndentation(path) {
      // const i = [...path].filter(c => c === '/').length - 2; // much ES6
      const i = path.split('/').length - 2;
      return i;
    },
    stringify(obj) {
      return JSON.stringify(obj);
    },
  },
  computed: {
    apiUrl() {
      if (this.$store.getters['auth/isLoggedIn']) {
        const uid = this.$store.getters['auth/user']._id;
        return `${process.env.VUE_APP_API_URL}/memberships/tree?user=${uid}`;
      }
      return `${process.env.VUE_APP_API_URL}/api/memberships/tree`;
    },
  },
  async created() {
    const { data: tree } = await api.get('/memberships/tree');
    this.tree = tree;
  },
};
</script>
