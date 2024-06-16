<template>
  <div class="ml-4 mt-4 text-white text-body-2">Responses</div>
  <a-list dense class="px-4">
    <list-item-card
      v-for="(entity, idx) in groupDrafts"
      :key="entity._id"
      :entity="entity"
      :idx="String(idx)"
      class="whiteCard"
      :smallCard="true"
      :menu="menu">
      <template v-slot:entityTitle>
        {{ entity.meta.survey.name }}
      </template>
      <template v-slot:entitySubtitle v-if="entity.meta.dateCreated">
        {{ formatDistance(parseISO(entity.meta.dateModified), new Date()) }} ago
      </template>
      <template v-slot:entitySubtitle v-else></template>
    </list-item-card>
    <a-list-item
      :to="{ path: `/groups/${props.id}/my-drafts` }"
      dense
      prepend-icon="mdi-file-document-edit-outline"
      class="text-white bg-transparent mb-2"
      rounded="lg">
      <a-list-item-title class="text-white">My Draft Responses</a-list-item-title>
    </a-list-item>
    <a-list-item
      :to="{ path: `/groups/${props.id}/my-submissions` }"
      dense
      prepend-icon="mdi-file-document-multiple-outline"
      class="text-white bg-transparent mb-2"
      rounded="lg">
      <a-list-item-title class="text-white">My Responses</a-list-item-title>
    </a-list-item>
    <a-list-item
      :to="{ path: `/groups/${props.id}/submissions` }"
      dense
      prepend-icon="mdi-file-document-multiple"
      class="text-white bg-transparent mb-2"
      rounded="lg">
      <a-list-item-title class="text-white">Group Responses</a-list-item-title>
    </a-list-item>
  </a-list>
</template>
<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import parseISO from 'date-fns/parseISO';
import formatDistance from 'date-fns/formatDistance';
import { useAllDrafts } from '../../queries';

import ListItemCard from '@/components/ui/ListItemCard.vue';

const props = defineProps({
  // group id from route param
  id: String,
})

const router = useRouter();
const route = useRoute();
const store = useStore();
const { data: allDrafts } = useAllDrafts();

const groupDrafts = computed(
  () => allDrafts.value.filter(draft => draft.meta.group?.id === props.id).slice(0, 2)
);
const menu = computed(() => [
  {
    title: 'Continue',
    icon: 'mdi-open-in-new',
    action: (e) => `/groups/${props.id}/surveys/${e.meta.survey.id}/submissions/${e._id}/edit`,
    render: (e) => () => true,
    color: 'green',
    buttonFixed: true,
  },
  {
    title: 'Delete',
    icon: 'mdi-trash-can-outline',
    action: (e) => `/todo`,
    color: 'red',
    disabled: false,
    buttonHover: true,
  },
]);
</script>

<style scoped lang="scss">
:deep(.whiteCard .v-list-item__content) {
  display: flex;
  align-items: center;
}
</style>
