<template>
  <div>
    <a-toolbar flat class="bg-background">
      <div class="flex-grow-1 d-flex flex-row mx-4">
        <div v-if="showNavigationControl" class="flex-shrink-1 flex-grow-0 align-content-center">
          <AppNavigationControl :handleClickCloseCallback="handleClose" />
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
          <div class="d-flex flex-column">
            <b>{{ surveyName }}</b>
            <span v-if="group" class="text-subtitle-2">{{ group.name }}</span>
          </div>
        </a-toolbar-title>

        <slot name="toolbar-actions"></slot>
      </div>
    </a-toolbar>
  </div>
</template>

<script setup>
import AppNavigationControl from '@/components/AppNavigationControl.vue';
import { computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

const props = defineProps([
  'showOverviewIcon',
  'surveyName',
  'questionNumber',
  'required',
  'anon',
  'groupId',
  'showNavigationControl',
  'handleClose',
]);

const group = computed(() => {
  if (!props.groupId) return null;
  return store.getters['memberships/groups'].find(group => group._id === props.groupId);
});

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
