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
              <a-list-item-title>{{ searchResult.name }}</a-list-item-title>
              <a-list-item-subtitle
                >last modified
                {{ searchResult.meta ? renderDateFromNow(searchResult.meta.dateModified) : '' }}</a-list-item-subtitle
              >
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import isValid from 'date-fns/isValid';
import parseISO from 'date-fns/parseISO';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import AListItemTitle from '@/components/ui/AListItemTitle.vue';
import AListItemSubtitle from '@/components/ui/AListItemSubtitle.vue';

export default {
  components: { AListItemSubtitle, AListItemTitle },
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
