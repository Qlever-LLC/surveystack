<template>
  <div>
    <v-dialog
      v-model="deleteQuestionModalIsVisible"
      max-width="290"
    >
      <v-card>
        <v-card-title>
          Remove Pinned Survey
        </v-card-title>
        <v-card-text class="mt-4">
          Are you sure you want to remove this pinned survey? The survey itself will not be removed.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text
            @click.stop="deleteQuestionModalIsVisible = false"
          >
            Cancel
          </v-btn>
          <v-btn
            text
            color="red"
            @click.stop="handleConfirmDelete"
          >
            Remove
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <draggable
      v-if="entities.length !== 0"
      class="draggable list-group"
      tag="div"
      :list="entities"
      :group="{ name: 'g1' }"
      :invertSwap="true"
      :dragOptions="{ animation: 200, }"
      @start="drag = true"
      @end="drag = false"
    >
      <v-card
        v-for="(el, idx) in entities"
        :key="`${idx}-survey-${el._id}`"
        class="mb-1"
      >
        <v-card-text>
          <div class="d-flex justify-space-between align-center">
            <div>
              <span class="caption grey--text text--darken-1">{{el._id}}</span>
              <br />
              <span class="title">{{el.name}}</span>
              <br />
              <span class="font-weight-light grey--text text--darken-2">last modified {{ renderDateFromNow(el.dateModified) }}</span>

            </div>
            <div class="d-flex">

              <v-btn
                icon
                @click.stop="() => showDeleteModal(idx)"
              >
                <v-icon color="grey lighten-1">mdi-delete</v-icon>
              </v-btn>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </draggable>
    <div v-else>
      <v-card class="mb-1">
        <v-card-text>
          <span class="title text--secondary">No pinned surveys yet</span><br />
          <span class="font-weight-light grey--text text--darken-2">You can add surveys from the menu in the top right</span>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script>
import draggable from 'vuedraggable';
import moment from 'moment';

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
    };
  },
  props: {
    entities: {
      required: false,
      type: Array,
    },
    selected: Object,

  },
  filters: {
    displayIndex(value) {
      return value.join('.');
    },
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
      return moment(date).fromNow();
    },
  },
};
</script>
