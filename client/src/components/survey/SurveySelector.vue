<template>
  <v-dialog max-width="500" v-model="dialog">
    <v-card>
      <v-card-title>Search surveys</v-card-title>
      <v-card-text>
        <v-text-field v-model="q" append-icon="mdi-magnify" @input="(e) => $emit('search', e)" />
        <v-list>
          <v-list-item
            v-for="searchResult in searchResults"
            :key="searchResult._id"
            @click="
              () => {
                $emit('selected', searchResult);
                dialog = false;
              }
            "
          >
            <v-list-item-content>
              <v-list-item-title>{{ searchResult.name }}</v-list-item-title>
              <v-list-item-subtitle
                >last modified
                {{ seachResult.meta ? renderDateFromNow(searchResult.meta.dateModified) : '' }}</v-list-item-subtitle
              >
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import moment from 'moment';

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
  },
  methods: {
    renderDateFromNow(date) {
      return moment(date).fromNow();
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
