<template>
  <a-container class="basicListContainer">
    <basic-list
      listType="row"
      :showSearch="false"
      :entities="groupDrafts"
      :menu="menu"
      :loading="isPending">
      <template v-slot:title>
        <a-icon class="mr-2">mdi-file-document-edit-outline</a-icon>
        My Draft Responses
        <a-chip class="ml-4" color="accent" rounded="lg" variant="flat" disabled>
          {{ groupDrafts.length }}
        </a-chip>
      </template>
      <template v-slot:entityTitle="{ entity }">
        {{ entity.meta.survey.name }}
      </template>
      <template v-slot:entitySubtitle="{ entity }">
        Last modified {{ new Date(entity.meta.dateModified).toLocaleString() }}
      </template>
      <template v-slot:pagination>
        <a-pagination v-model="paginationPage" :length="paginationLength" color="grey-darken-1" />
      </template>
      <template v-slot:noValue> No Drafts available</template>
    </basic-list>
  </a-container>
</template>
<script setup>
import BasicList from '@/components/ui/BasicList2.vue';
import { computed, reactive, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useGroup } from '@/components/groups/group';
import { useAllDrafts, useSyncDrafts } from '../../queries';

const props = defineProps({
  // group id from route param
  id: String,
})

const PAGINATION_LIMIT = 10;
const { data: allDrafts, isPending, isError } = useAllDrafts();
const { isPending: syncDraftsIsPending, mutate: syncDrafts } = useSyncDrafts();

if (!syncDraftsIsPending.value !== true) {
 syncDrafts(); 
}

const groupDrafts = computed(
  () => allDrafts.value.filter(draft => draft.meta.group?.id === props.id)
);
const paginationPage = ref(1);
const paginationLength = computed(() => {
  const length = groupDrafts.value?.length;
  return length ? Math.ceil(length / PAGINATION_LIMIT) : 0;
});
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
    render: (e) => () => true,
    color: 'red',
    buttonHover: true,
  },
]);
</script>
<style scoped lang="scss"></style>
