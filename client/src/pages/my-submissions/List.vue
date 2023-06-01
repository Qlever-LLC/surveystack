<template>
  <div class="wrapper background">
    <v-container class="pb-8">
      <draft-filter></draft-filter>

      <div class="mt-8">
        <draft-card
          v-for="submission in submissions"
          :key="submission._id"
          :submission="submission"
          :checked="checked.includes(submission)"
          @click.native="handleCardCheck(submission)"
        >
        </draft-card>

        <p v-if="submissions.length === 0" class="text-center">No matching submissions found.</p>
      </div>

      <v-progress-circular v-if="isLoading" :size="30" color="primary" class="my-4" indeterminate></v-progress-circular>
      <div ref="lastEl" v-else-if="hasMoreData"></div>
    </v-container>

    <v-fab-transition>
      <v-btn v-show="showTopButton" color="pink" dark fixed right fab small @click="handleToTop">
        <v-icon>mdi-arrow-up</v-icon>
      </v-btn>
    </v-fab-transition>
  </div>
</template>

<script>
import { computed, defineComponent, onUnmounted, onUpdated, ref, watch } from '@vue/composition-api';
import DraftFilter from '@/components/my-submissions/Filter.vue';
import DraftCard from '@/components/my-submissions/Card.vue';

export default defineComponent({
  components: {
    DraftFilter,
    DraftCard,
  },
  setup(props, { root }) {
    const isLoading = computed(() => root.$store.getters['submissions/isFetching']);
    const hasMoreData = computed(() => root.$store.getters['submissions/hasMoreData']);
    const submissions = computed(() => root.$store.getters['submissions/submissions']);
    const lastEl = ref();
    const checked = ref([]);
    const showTopButton = ref(false);

    const handleCardCheck = (submission) => {
      if (submission.meta.archived) {
        return;
      } else if (checked.value.includes(submission)) {
        checked.value = checked.value.filter((i) => i !== submission);
      } else {
        checked.value.push(submission);
      }
    };

    const handleToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleScroll = () => {
      showTopButton.value = window.scrollY > 400;
    };

    onUpdated(() => {
      window.addEventListener('scroll', handleScroll);
    });

    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll);
    });

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
      isLoading,
      hasMoreData,
      submissions,
      lastEl,
      checked,
      showTopButton,
      handleCardCheck,
      handleToTop,
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
