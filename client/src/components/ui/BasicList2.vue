<template>
  <!-- TODO instead of a div block use a-card like in BasicList.vue -->
  <div class="mx-4">
    <span v-if="showSearch" class="d-flex mb-6">
      <a-text-field
        v-model="state.searchValue"
        dense
        hideDetails
        label="Search"
        prependInnerIcon="mdi-magnify"
        rounded="lg"
        variant="outlined" />
      <a-btn class="ml-6">
        <a-icon>mdi-24px mdi-tune</a-icon>
      </a-btn>
    </span>
    <a-list v-for="(entity, idx) in filteredEntities" :key="entity._id" dense twoLine class="pt-0">
      <list-item-card v-if="listCard" :entity="entity" :idx="String(idx)" :enableFav="enableFav"></list-item-card>
    </a-list>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue';
import isValid from 'date-fns/isValid';
import parseISO from 'date-fns/parseISO';
import formatDistance from 'date-fns/formatDistance';

import ListItemCard from './ListItemCard.vue';

const props = defineProps({
  entities: {
    type: Array,
    required: true,
  },
  listCard: {
    type: Boolean,
    required: false,
    default: false,
  },
  // TODO favorite part should be linked/merge with pinned like pinned survey and not done like this
  enableFav: {
    type: Boolean,
    required: false,
    default: false,
  },
  showSearch: {
    type: Boolean,
    default: true,
  },
  filter: {
    type: Function,
  },
});

const state = reactive({
  searchValue: '',
});

const entities = computed(() => {
  // already done for surveys in fetchData in Browse.vue
  // TODO define a unique schema for fetching for instance
  const now = new Date();
  props.entities.forEach((e) => {
    if (e.meta) {
      const parsedDate = parseISO(e.meta.dateCreated);
      if (isValid(parsedDate)) {
        e.createdAgo = formatDistance(parsedDate, now);
      }
    }
  });
  return props.entities;
});

const filteredEntities = computed(() => {
  if (props.filter) {
    return props.filter(entities.value, state.searchValue);
  }
  return defaultFilter();
});

function defaultFilter() {
  if (!state.searchValue) {
    return entities.value;
  }
  return entities.value.filter((entity) => entity.name.toLowerCase().indexOf(state.searchValue.toLowerCase()) > -1);
}
</script>

<style scoped>
.v-list {
  background: transparent;
}

:deep(.v-list-item-title) {
  line-height: 1.6rem;
}

:deep(.v-list-item__content) {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
