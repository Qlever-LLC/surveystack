<template>
  <v-card class="pb-2">
    <v-card-title
      >Pinned Surveys
      <v-spacer />
      <v-btn color="primary" text @click="openSearchDialog">New..</v-btn>
    </v-card-title>
    <draggable
      v-if="entities.length !== 0"
      class="draggable list-group"
      tag="div"
      :list="entities"
      :group="{ name: 'g1' }"
      :invertSwap="true"
      :dragOptions="{ animation: 200 }"
      @start="drag = true"
      @end="drag = false"
    >
      <v-card v-for="(el, idx) in entities" :key="`${idx}-survey-${el._id}`" class="ma-2 mx-6" elevation="1" outlined>
        <v-card-text>
          <div class="d-flex justify-space-between align-center">
            <div>
              <span class="caption grey--text text--darken-1">{{ el._id }}</span>
              <br />
              <span class="title">{{ el.name }}</span>
              <br />
              <span class="font-weight-light grey--text text--darken-2" v-if="el.meta">
                last modified {{ renderDateFromNow(el.meta.dateModified) }}
              </span>
            </div>
            <div class="d-flex">
              <v-btn icon @click.stop="() => showDeleteModal(idx)">
                <v-icon color="grey lighten-1">mdi-delete</v-icon>
              </v-btn>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </draggable>
    <v-card class="ma-2" outlined elevation="1" v-else>
      <v-card-text>
        <span class="title text--secondary">No pinned surveys yet</span><br />
        <span class="font-weight-light grey--text text--darken-2"
          >You can add surveys from the menu in the top right</span
        >
      </v-card-text>
    </v-card>
    <v-dialog v-model="deleteQuestionModalIsVisible" max-width="290">
      <v-card>
        <v-card-title> Remove Pinned Survey </v-card-title>
        <v-card-text class="mt-4">
          Are you sure you want to remove this pinned survey? The survey itself will not be removed.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click.stop="deleteQuestionModalIsVisible = false"> Cancel </v-btn>
          <v-btn text color="red" @click.stop="handleConfirmDelete"> Remove </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showSearchDialog" max-width="500">
      <v-card>
        <v-card-title>Search surveys</v-card-title>
        <v-card-text>
          <v-text-field v-model="q" append-icon="mdi-magnify" @input="(e) => $emit('search', e)" />
          <v-list>
            <a-list-item v-for="searchResult in searchResults" :key="searchResult._id" @click="pinSurvey(searchResult)">
              <v-list-item-content>
                <a-list-item-title>{{ searchResult.name }}</a-list-item-title>
                <a-list-item-subtitle v-if="searchResult.meta">
                  last modified {{ renderDateFromNow(searchResult.meta.dateModified) }}
                </a-list-item-subtitle>
              </v-list-item-content>
            </a-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>
    <slot name="footer">
      <div></div>
    </slot>
  </v-card>
</template>

<script>
import draggable from 'vuedraggable';
import isValid from 'date-fns/isValid';
import parseISO from 'date-fns/parseISO';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import AListItem from '@/components/ui/AListItem.vue';
import AListItemTitle from '@/components/ui/AListItemTitle.vue';
import AListItemSubtitle from '@/components/ui/AListItemSubtitle.vue';

export default {
  name: 'nested-draggable',
  components: {
    AListItemSubtitle,
    AListItemTitle,
    AListItem,
    draggable,
  },
  data() {
    return {
      drag: false,
      deleteQuestionModalIsVisible: false,
      deleteQuestionIndex: null,
      showSearchDialog: false,
      q: '',
    };
  },
  props: {
    entities: {
      required: false,
      type: Array,
    },
    searchResults: {
      type: Array,
    },
  },
  mounted() {
    console.log('entities', this.entities);
  },
  methods: {
    showDeleteModal(index) {
      this.deleteQuestionModalIsVisible = true;
      this.deleteQuestionIndex = index;
    },
    handleConfirmDelete() {
      this.removeAt(this.deleteQuestionIndex);
      this.deleteQuestionModalIsVisible = false;
    },
    removeAt(idx) {
      this.entities.splice(idx, 1);
    },
    renderDateFromNow(date) {
      const parsedDate = parseISO(date);
      return isValid(parsedDate) ? formatDistanceToNow(parseISO(date), { addSuffix: true }) : '';
    },
    openSearchDialog() {
      this.$emit('search', '');
      this.showSearchDialog = true;
    },
    pinSurvey(survey) {
      this.entities.splice(0, 0, survey);
      this.showSearchDialog = false;
    },
  },
};
</script>
