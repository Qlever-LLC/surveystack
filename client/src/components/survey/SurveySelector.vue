<template>
  <a-dialog max-width="500" v-model="dialog">
    <a-card>
      <a-card-title>Search surveys</a-card-title>
      <a-card-text>
        <a-text-field v-model="q" append-icon="mdi-magnify" @input="(e) => $emit('search', e)" />
        <a-list>
          <a-list-item
            v-for="searchResult in searchResults"
            :key="searchResult._id"
            @click="
              () => {
                $emit('selected', searchResult);
                dialog = false;
              }
            "
          >
            <a-list-item-title>{{ searchResult.name }}</a-list-item-title>
            <a-list-item-subtitle
              >last modified
              {{ searchResult.meta ? renderDateFromNow(searchResult.meta.dateModified) : '' }}</a-list-item-subtitle
            >
          </a-list-item>
        </a-list>
      </a-card-text>
    </a-card>
  </a-dialog>
</template>

<script>
import isValid from 'date-fns/isValid';
import parseISO from 'date-fns/parseISO';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';

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
      const parsedDate = parseISO(date);
      return isValid(parsedDate) ? formatDistanceToNow(parseISO(date), { addSuffix: true }) : '';
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
