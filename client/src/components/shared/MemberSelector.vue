<template>
  <v-dialog max-width="500" max-height="100" v-model="dialog">
    <v-card>
      <v-card-title>Search members</v-card-title>
      <v-card-text>
        <v-text-field v-model="q" append-icon="mdi-magnify" />
        <v-list>
          <v-list-item
            v-for="searchResult in filteredSearchResults"
            :key="searchResult._id"
            :disabled="searchResult.meta.status === 'pending'"
            @click="
              $emit('selected', searchResult);
              dialog = false;
            "
          >
            <v-list-item-content v-if="searchResult.meta && searchResult.meta.status === 'pending'">
              <v-list-item-title class="text--secondary"
                >[Pending] {{ searchResult.meta.invitationEmail
                }}{{
                  searchResult.meta.invitationName ? ` - ${searchResult.meta.invitationName}` : ''
                }}</v-list-item-title
              >
              <v-list-item-subtitle>{{
                searchResult.meta.dateSent ? `sent ${searchResult.meta.dateSent}` : 'Invitation not sent yet'
              }}</v-list-item-subtitle>
            </v-list-item-content>
            <v-list-item-content v-else>
              <v-list-item-title>{{ searchResult.user.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ searchResult.user.email }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    searchResults: {
      type: Array,
      required: true,
    },
    show: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      q: '',
    };
  },
  computed: {
    dialog: {
      get() {
        return this.show;
      },
      set(newValue) {
        if (!newValue) {
          this.$emit('hide');
        }
      },
    },
    filteredSearchResults() {
      if (!this.q) {
        return this.searchResults;
      }
      const ql = this.q.toLowerCase();

      return this.searchResults.filter((entity) => {
        if (entity.user) {
          if (entity.user.name.toLowerCase().indexOf(ql) > -1) {
            return true;
          }

          if (entity.user.email.toLowerCase().startsWith(ql)) {
            return true;
          }
        } else if (entity.meta.invitationEmail) {
          if (entity.meta.invitationEmail.toLowerCase().indexOf(ql) > -1) {
            return true;
          }
        }

        return false;
      });
    },
  },
  mounted() {
    this.value = true;
  },
  async created() {
    this.$emit('search', this.q);
    this.value = true;
  },
};
</script>
