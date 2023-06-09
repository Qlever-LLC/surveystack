<template>
  <div class="wrapper background">
    <v-container
      :class="{
        'pb-8': !isFooterOpen,
        'mb-4 pb-16': isFooterOpen,
      }"
    >
      <draft-filter></draft-filter>

      <div class="mt-8">
        <draft-card
          v-for="submission in submissions"
          :key="submission._id + submission.options.draft"
          :submission="submission"
          @submit-draft="setDraftToSubmit"
        >
        </draft-card>
      </div>

      <div v-if="isLoading" class="d-flex justify-center my-8">
        <v-progress-circular :size="30" color="primary" indeterminate></v-progress-circular>
      </div>
      <div ref="lastEl" v-else-if="hasMoreData"></div>
      <p v-else-if="submissions.length === 0" class="text-center">No matching submissions found.</p>
    </v-container>

    <draft-footer @open-change="isFooterOpen = $event" />

    <v-fab-transition>
      <v-btn
        v-show="isTopButtonVisible"
        :class="{
          'mb-12': isFooterOpen,
        }"
        color="pink"
        dark
        fixed
        right
        fab
        small
        @click="handleToTop"
      >
        <v-icon>mdi-arrow-up</v-icon>
      </v-btn>
    </v-fab-transition>

    <confirm-submission-dialog
      v-if="draftToSubmit"
      v-model="isSubmitDialogOpen"
      :id="draftToSubmit._id"
      :groupId="draftToSubmit.meta.group.id"
      :submitAsUser="draftToSubmit.meta.submitAsUser"
      :dateSubmitted="draftToSubmit.meta.dateSubmitted"
      @set-group="setGroup"
      @close="closeSubmitDraft"
      @submit="submitDraft"
    />
  </div>
</template>

<script>
import ConfirmSubmissionDialog from '@/components/survey/drafts/ConfirmSubmissionDialog.vue';
import { computed, defineComponent, onMounted, onUnmounted, ref, watch } from '@vue/composition-api';
import DraftFilter from '@/components/my-submissions/Filter.vue';
import DraftCard from '@/components/my-submissions/Card.vue';
import DraftFooter from '@/components/my-submissions/Footer.vue';
import { SubmissionLoadingActions } from '@/store/modules/submissions.store';

export default defineComponent({
  components: {
    DraftFilter,
    DraftCard,
    DraftFooter,
    ConfirmSubmissionDialog,
  },
  setup(props, { root }) {
    const isFooterOpen = ref(false);
    const isLoading = computed(() =>
      root.$store.getters['submissions/getLoading'](SubmissionLoadingActions.FETCH_SUBMISSIONS)
    );
    const hasMoreData = computed(() => root.$store.getters['submissions/hasMoreData']);
    const submissions = computed(() => root.$store.getters['submissions/mySubmissions']);
    const lastEl = ref();
    const isTopButtonVisible = ref(false);
    const isSubmitDialogOpen = ref(false);
    const draftToSubmit = ref();

    const setGroup = (id) => {
      if (draftToSubmit.value) {
        draftToSubmit.value.meta.group = { id };
      }
    };

    const setDraftToSubmit = (draft) => {
      draftToSubmit.value = draft;
      isSubmitDialogOpen.value = true;
    };

    const submitDraft = async () => {
      await root.$store.dispatch('submissions/submitDrafts', [draftToSubmit.value]);
      draftToSubmit.value = undefined;
    };

    const closeSubmitDraft = ({ done }) => {
      if (done) {
        draftToSubmit.value = undefined;
      }
    };

    // Scroll to top
    const handleToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleScroll = () => {
      isTopButtonVisible.value = window.scrollY > 400;
    };

    onMounted(() => {
      window.addEventListener('scroll', handleScroll);
    });

    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll);
    });

    // Infinite scrolling
    let cleanup = undefined;
    watch(
      lastEl,
      (val) => {
        if (cleanup) {
          cleanup();
        }

        if (!val) {
          return;
        }

        const observer = new IntersectionObserver(
          ([{ isIntersecting }]) => {
            if (isIntersecting) {
              root.$store.dispatch('submissions/fetchSubmissions');
            }
          },
          {
            rootMargin: '0px',
            threshold: 0.1,
          }
        );

        observer.observe(val);

        cleanup = () => {
          observer.disconnect();
          cleanup = undefined;
        };
      },
      {
        immediate: true,
        flush: 'post',
      }
    );

    return {
      isFooterOpen,
      isLoading,
      hasMoreData,
      submissions,
      lastEl,
      isTopButtonVisible,
      draftToSubmit,
      isSubmitDialogOpen,
      setGroup,
      setDraftToSubmit,
      submitDraft,
      closeSubmitDraft,
      handleToTop,
      handleScroll,
    };
  },
});
</script>

<style lang="scss" scoped>
.wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100%;

  .container {
    position: relative;
    flex: 1 1 0%;
    max-width: 1280px;
  }

  .v-btn--fab {
    bottom: 28px;
  }
}
</style>
