<template>
  <footer v-if="isOpen" class="action-bar">
    <v-container>
      <span class="flex-grow-1">Selected: {{ selected.length }}</span>

      <div class="buttons d-flex align-center">
        <draft-submit-bulk :drafts="draftsToSubmit" :disabled="isLoading" @loading-change="isLoading = $event" />
        <draft-delete-bulk
          :drafts="selected"
          :disabled="isLoading"
          @loading-change="isLoading = $event"
          @error="error = { title: 'Delete Drafts Error', message: $event }"
        />
        <export-json-bulk :submissions="selected" :disabled="isLoading" />
      </div>

      <div class="flex-grow-1 text-end">
        <v-btn text dark small @click="handleClear">Clear all</v-btn>
      </div>
    </v-container>

    <v-dialog v-if="error" :value="!!error" max-width="400" @input="error = null">
      <v-card class="d-flex flex-column">
        <v-card-title> {{ error.title }} </v-card-title>
        <v-card-text>
          <v-alert type="error" class="ma-4 d-flex justify-center">
            {{ error.message }}
          </v-alert>
        </v-card-text>
        <v-spacer></v-spacer>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click.stop="error = null"> Close </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </footer>
</template>

<script>
import { computed, defineComponent, ref } from '@vue/composition-api';
import DraftSubmitBulk from './actions/DraftSubmitBulk.vue';
import DraftDeleteBulk from './actions/DraftDeleteBulk.vue';
import ExportJsonBulk from './actions/ExportJsonBulk.vue';

export default defineComponent({
  components: {
    DraftSubmitBulk,
    DraftDeleteBulk,
    ExportJsonBulk,
  },
  setup(props, { root }) {
    const selected = computed(() => root.$store.getters['myDrafts/selected']);
    const error = ref(null);
    const isLoading = ref(false);
    const isOpen = computed(() => selected.value.length > 0);
    const draftsToSubmit = computed(() =>
      selected.value.filter((item) => item.meta.status.some((item) => item.type === 'READY_TO_SUBMIT'))
    );

    const handleClear = () => {
      root.$store.dispatch('myDrafts/clearSelection');
    };

    return {
      selected,
      error,
      isLoading,
      isOpen,
      draftsToSubmit,
      handleClear,
    };
  },
});
</script>

<style lang="scss">
.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  box-shadow: 0px 3px 5px -1px rgba(0, 0, 0, 0.2), 0px 6px 10px 0px rgba(0, 0, 0, 0.14),
    0px 1px 18px 0px rgba(0, 0, 0, 0.12);
  background-color: #455a64;
  border-top: 1px solid #546e7a;
  color: white;
  display: flex;
  justify-content: center;
  z-index: 1;

  .container {
    display: flex;
    align-items: center;
    max-width: 1280px;

    .buttons {
      & > * + * {
        margin-left: 12px;
      }
    }
  }
}
</style>
