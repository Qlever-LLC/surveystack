<template>
  <div>
    <v-dialog v-if="drafts.length > 0" v-model="isOpen" max-width="400">
      <template v-slot:activator="{ on, attrs }">
        <slot :on="on" :attrs="attrs">
          <v-btn v-bind="attrs" color="primary" dark :disabled="disabled" :loading="isLoading" v-on="on">
            Submit ({{ drafts.length }})
          </v-btn>
        </slot>
      </template>

      <v-card class="d-flex flex-column">
        <v-card-title> Submit Drafts </v-card-title>

        <v-card-text class="pt-0">
          <strong>{{ `${submittedCount} of ${drafts.length}` }}</strong> submissions were previously submitted.
          Resubmission will archive the previous submissions. Are you sure you want to submit?
        </v-card-text>

        <v-spacer></v-spacer>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click.stop="isOpen = false"> Cancel </v-btn>
          <v-btn text color="primary" @click.stop="handleSubmitDrafts"> Submit </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <result-dialog
      v-model="showResult"
      title="Result of Submissions"
      :items="resultItems"
      @input="handleResultDialogInput"
    />
  </div>
</template>

<script>
import { computed, defineComponent, ref, watch } from '@vue/composition-api';
import ResultDialog from '@/components/ui/ResultDialog.vue';

export default defineComponent({
  components: {
    ResultDialog,
  },
  props: {
    drafts: {
      type: Array,
      required: true,
    },
    disabled: { type: Boolean },
  },
  emits: ['loading-change', 'success'],
  setup(props, { root, emit }) {
    const isOpen = ref(false);
    const isLoading = ref(false);
    const showResult = ref(false);
    const resultItems = ref([]);
    const submittedCount = computed(() => props.drafts.filter((item) => !!item.meta.dateSubmitted).length);

    const handleSubmitDrafts = async () => {
      isOpen.value = false;
      isLoading.value = true;
      resultItems.value = await root.$store.dispatch('submissions/submitDrafts', props.drafts);
      isLoading.value = false;
      showResult.value = true;
    };

    const handleResultDialogInput = (val) => {
      if (!val) {
        const success = resultItems.value.filter((item) => item.error).length === 0;
        if (success) {
          emit('success');
        }
        resultItems.value = [];
      }
    };

    watch(isLoading, (val) => {
      emit('loading-change', val);
    });

    return {
      isOpen,
      isLoading,
      showResult,
      resultItems,
      submittedCount,
      handleSubmitDrafts,
      handleResultDialogInput,
    };
  },
});
</script>
