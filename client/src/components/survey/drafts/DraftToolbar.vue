<template>
  <div>
    <a-toolbar flat class="bg-background">
      <div class="flex-grow-1 d-flex flex-row mx-4">
        <div v-if="showNavigationControl" class="flex-shrink-1 flex-grow-0 align-content-center">
          <AppNavigationControl />
        </div>

        <div class="flex-shrink-1 flex-grow-0 align-content-center mx-2">
          <a-btn
            v-if="showOverviewIcon"
            @click="$emit('showOverviewClicked')"
            size="md"
            icon
            variant="elevated"
            :rounded="0">
            <a-icon>mdi-format-list-numbered</a-icon>
          </a-btn>
        </div>

        <div class="flex-shrink-1 flex-grow-0 align-content-center mx-2">
          <div class="infos text-grey-darken-2">
            <div class="d-flex">
              <span class="number-chip mx-2" style="margin-top: 2px">{{ questionNumber }}</span>
            </div>
          </div>
        </div>
        <a-toolbar-title id="draft-toolbar" class="flex-grow-1 flex-shrink-0 align-content-center text-center">
          <b>{{ surveyName }}</b>
        </a-toolbar-title>

        <slot name="toolbar-actions"></slot>
      </div>
    </a-toolbar>
  </div>
</template>

<script>
import AppNavigationControl from '@/components/AppNavigationControl.vue';

export default {
  components: { AppNavigationControl },
  props: ['showOverviewIcon', 'surveyName', 'questionNumber', 'required', 'anon', 'groupPath', 'showNavigationControl'],
};
</script>

<style scoped lang="scss">
.number-chip {
  display: inline-flex;
  border: 2px solid currentColor;
  background-color: white;
  border-radius: 1rem;
  line-height: 1rem;
  font-weight: bold;
  font-size: 1rem;
  padding: 0.4rem;
  padding-left: 0.8rem;
  padding-right: 0.9rem;
}
</style>
