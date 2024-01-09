<template>
  <a-card class="pb-2">
    <a-card-title
      >Pinned Surveys
      <a-spacer />
      <a-btn color="primary" variant="text" @click="openSearchDialog">New..</a-btn>
    </a-card-title>
    <VueDraggable
      v-if="entities.length !== 0"
      class="draggable list-group"
      tag="div"
      :list="entities"
      :group="{ name: 'g1' }"
      :invertSwap="true"
      :dragOptions="{ animation: 200 }"
      @start="drag = true"
      @end="drag = false">
      <a-card
        v-for="(el, idx) in entities"
        :key="`${idx}-survey-${el._id}`"
        class="ma-2 mx-6"
        elevation="1"
        variant="outlined">
        <a-card-text>
          <div class="d-flex justify-space-between align-center">
            <div>
              <span class="text-caption text-grey-darken-1">{{ el._id }}</span>
              <br />
              <span class="title">{{ el.name }}</span>
              <br />
              <span class="font-weight-light text-grey-darken-2" v-if="el.meta">
                last modified {{ renderDateFromNow(el.meta.dateModified) }}
              </span>
            </div>
            <div class="d-flex">
              <a-btn icon @click.stop="() => showDeleteModal(idx)">
                <a-icon color="grey-lighten-1">mdi-delete</a-icon>
              </a-btn>
            </div>
          </div>
        </a-card-text>
      </a-card>
    </VueDraggable>
    <a-card class="ma-2" variant="outlined" elevation="1" v-else>
      <a-card-text>
        <span class="title text-secondary">No pinned surveys yet</span><br />
        <span class="font-weight-light text-grey-darken-2">You can add surveys from the menu in the top right</span>
      </a-card-text>
    </a-card>
    <a-dialog v-model="deleteQuestionModalIsVisible" max-width="290">
      <a-card>
        <a-card-title> Remove Pinned Survey </a-card-title>
        <a-card-text class="mt-4">
          Are you sure you want to remove this pinned survey? The survey itself will not be removed.
        </a-card-text>
        <a-card-actions>
          <a-spacer />
          <a-btn variant="text" @click.stop="deleteQuestionModalIsVisible = false"> Cancel </a-btn>
          <a-btn variant="text" color="red" @click.stop="handleConfirmDelete"> Remove </a-btn>
        </a-card-actions>
      </a-card>
    </a-dialog>

    <a-dialog v-model="showSearchDialog" max-width="500">
      <a-card>
        <a-card-title>Search surveys</a-card-title>
        <a-card-text>
          <a-text-field v-model="q" append-inner-icon="mdi-magnify" @update:modelValue="(e) => $emit('search', e)" />
          <a-list>
            <a-list-item v-for="searchResult in searchResults" :key="searchResult._id" @click="pinSurvey(searchResult)">
              <a-list-item-title>{{ searchResult.name }}</a-list-item-title>
              <a-list-item-subtitle v-if="searchResult.meta">
                last modified {{ renderDateFromNow(searchResult.meta.dateModified) }}
              </a-list-item-subtitle>
            </a-list-item>
          </a-list>
        </a-card-text>
      </a-card>
    </a-dialog>
    <slot name="footer">
      <div></div>
    </slot>
  </a-card>
</template>

<script>
import { VueDraggable } from 'vue-draggable-plus';
import isValid from 'date-fns/isValid';
import parseISO from 'date-fns/parseISO';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';

export default {
  name: 'nested-draggable',
  components: {
    VueDraggable,
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
