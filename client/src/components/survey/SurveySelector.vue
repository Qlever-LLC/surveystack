<template>
  <v-dialog max-width="500" v-model="dialog">
    <a-card>
      <a-card-title>Search surveys</a-card-title>
      <a-card-text>
        <a-text-field v-model="q" append-icon="mdi-magnify" @input="(e) => $emit('search', e)" />
        <v-list>
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
            <v-list-item-content>
              <a-list-item-title>{{ searchResult.name }}</a-list-item-title>
              <a-list-item-subtitle
                >last modified
                {{ searchResult.meta ? renderDateFromNow(searchResult.meta.dateModified) : '' }}</a-list-item-subtitle
              >
            </v-list-item-content>
          </a-list-item>
        </v-list>
      </a-card-text>
    </a-card>
  </v-dialog>
</template>

<script>
import isValid from 'date-fns/isValid';
import parseISO from 'date-fns/parseISO';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import ACard from '@/components/ui/ACard.vue';
import ACardText from '@/components/ui/ACardText.vue';
import ACardTitle from '@/components/ui/ACardTitle.vue';

export default {
  components: {
    ACard,
    ACardText,
    ACardTitle,
  },
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
