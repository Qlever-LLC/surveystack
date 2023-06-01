<template>
  <div class="background wrapper">
    <v-container class="text-center pb-8">
      <draft-filter></draft-filter>

      <div class="mt-8">
        <draft-card
          v-for="submission in submissions"
          :key="submission._id"
          :submission="submission"
          :checked="checked.includes(submission)"
          @click.native="handleCheck(submission)"
        >
        </draft-card>

        <p v-if="submissions.length === 0" class="text-center">No matching submissions found.</p>
      </div>

      <v-progress-circular v-if="isLoading" :size="30" color="primary" class="my-4" indeterminate></v-progress-circular>
      <div ref="lastEl" v-else-if="hasMoreData"></div>
    </v-container>
  </div>
</template>

<script>
import { computed, defineComponent, ref, watch } from '@vue/composition-api';
import DraftFilter from '@/components/drafts/Filter.vue';
import DraftCard from '@/components/drafts/Card.vue';

export default defineComponent({
  components: { DraftFilter, DraftCard },
  setup(props, { root }) {
    const isLoading = computed(() => root.$store.getters['submissions/isFetching']);
    const hasMoreData = computed(() => root.$store.getters['submissions/hasMoreData']);
    const submissions = computed(() => root.$store.getters['submissions/submissions']);
    const lastEl = ref();
    const checked = ref([]);

    const handleCheck = (submission) => {
      if (submission.meta.archived) {
        return;
      } else if (checked.value.includes(submission)) {
        checked.value = checked.value.filter((i) => i !== submission);
      } else {
        checked.value.push(submission);
      }
    };

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
      handleCheck,
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
  }
}
</style>
