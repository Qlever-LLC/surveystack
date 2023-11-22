<template>
  <a-card class="pb-2">
    <a-card-title
      >Pinned Surveys
      <a-spacer />
      <v-btn color="primary" text @click="openSearchDialog">New..</v-btn>
    </a-card-title>
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
      <a-card v-for="(el, idx) in entities" :key="`${idx}-survey-${el._id}`" class="ma-2 mx-6" elevation="1" outlined>
        <a-card-text>
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
                <a-icon color="grey lighten-1">mdi-delete</a-icon>
              </v-btn>
            </div>
          </div>
        </a-card-text>
      </a-card>
    </draggable>
    <a-card class="ma-2" outlined elevation="1" v-else>
      <a-card-text>
        <span class="title text--secondary">No pinned surveys yet</span><br />
        <span class="font-weight-light grey--text text--darken-2"
          >You can add surveys from the menu in the top right</span
        >
      </a-card-text>
    </a-card>
    <v-dialog v-model="deleteQuestionModalIsVisible" max-width="290">
      <a-card>
        <a-card-title> Remove Pinned Survey </a-card-title>
        <a-card-text class="mt-4">
          Are you sure you want to remove this pinned survey? The survey itself will not be removed.
        </a-card-text>
        <a-card-actions>
          <a-spacer />
          <v-btn text @click.stop="deleteQuestionModalIsVisible = false"> Cancel </v-btn>
          <v-btn text color="red" @click.stop="handleConfirmDelete"> Remove </v-btn>
        </a-card-actions>
      </a-card>
    </v-dialog>

    <v-dialog v-model="showSearchDialog" max-width="500">
      <a-card>
        <a-card-title>Search surveys</a-card-title>
        <a-card-text>
          <a-text-field v-model="q" append-icon="mdi-magnify" @input="(e) => $emit('search', e)" />
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
        </a-card-text>
      </a-card>
    </v-dialog>
    <slot name="footer">
      <div></div>
    </slot>
  </a-card>
</template>

<script>
import draggable from 'vuedraggable';
import isValid from 'date-fns/isValid';
import parseISO from 'date-fns/parseISO';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';

export default {
  name: 'nested-draggable',
  components: {
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
