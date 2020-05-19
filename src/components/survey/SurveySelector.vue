<template>
  <div>
    <v-dialog
      v-model="showSearchDialog"
      max-width="500"
    >
      <v-card>
        <v-card-title>Search surveys</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="q"
            append-icon="mdi-magnify"
            @input="(e) => $emit('search', e)"
          />
          <v-list>
            <v-list-item
              v-for="searchResult in searchResults"
              :key="searchResult._id"
              @click="(s) => $emit('selected', s)"
            >
              <v-list-item-content>
                <v-list-item-title>{{searchResult.name}}</v-list-item-title>
                <v-list-item-subtitle>last modified {{ renderDateFromNow(searchResult.meta.dateModified) }}</v-list-item-subtitle>

              </v-list-item-content>

            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import moment from 'moment';

export default {
  props: {
    searchResults: {
      type: Array,
      required: true,
    },
  },
  data() {
    return {
      showSearchDialog: true,
      q: '',
    };
  },
  methods: {
    renderDateFromNow(date) {
      return moment(date).fromNow();
    },
  },
  async created() {
    this.$emit('search', this.q);
  },
};
</script>
