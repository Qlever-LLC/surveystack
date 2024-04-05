<template>
  <a-card :loading="loading" color="background">
    <a-card-title v-if="showTitle" class="text-heading d-flex pa-4">
      <a-col align="start" class="flex-grow-0">
        <AppNavigationControl />
      </a-col>
      <a-col class="flex-grow-1 pl-0" :class="mobile ? 'text-center' : 'text-center'">
        <slot name="title" />
      </a-col>
      <a-col align="end" class="flex-grow-0">
        <a-btn v-if="buttonNew" color="accent" :to="buttonNew.link" variant="flat" rounded="lg">
          <a-icon class="mdi-24px"> mdi-plus-circle-outline </a-icon>
          <div v-if="!mobile" class="ml-2">{{ buttonNew.title }}</div>
        </a-btn>
      </a-col>
    </a-card-title>
    <a-card-text>
      <a-list v-if="enableFav" dense twoLine class="pt-0">
        <list-item-card
          v-for="(entity, idx) in pinnedSurveys"
          :key="entity._id"
          @toogleStar="$emit('toogleStar', entity)"
          :entity="entity"
          :idx="String(idx)"
          :enableFav="enableFav"
          :pinnedSurveys="pinnedSurveys"
          :groupStyle="groupStyle"
          :menu="menu" />
      </a-list>
      <span v-if="showSearch" class="d-flex mb-6">
        <a-text-field
          v-model="state.searchValue"
          bgColor="transparent"
          dense
          hideDetails
          label="Search"
          prependInnerIcon="mdi-magnify"
          rounded="lg"
          variant="solo-filled"
          clearable />
        <a-btn
          class="ml-6"
          :color="state.showFilter ? 'primary' : 'accent-lighten-8-no bg-transparent'"
          @click="state.showFilter = !state.showFilter"
          style="height: 40px">
          <a-icon v-if="state.showFilter">mdi-24px mdi-close</a-icon>
          <a-icon v-else>mdi-24px mdi-tune</a-icon>
        </a-btn>
      </span>
      <div v-if="state.showFilter" class="mt-n4 mb-6">
        <slot name="filter" />
      </div>
      <a-list v-if="listCard && filteredEntities.length > 0" dense twoLine class="pt-0">
        <list-item-card
          v-for="(entity, idx) in filteredEntities"
          :key="entity._id"
          @toogleStar="$emit('toogleStar', entity)"
          :entity="entity"
          :idx="String(idx)"
          :enableFav="enableFav"
          :pinnedSurveys="pinnedSurveys"
          :groupStyle="groupStyle"
          :menu="menu" />
      </a-list>
      <a-list v-else-if="filteredEntities.length > 0">
        <list-item-row
          v-for="(entity, idx) in filteredEntities"
          :key="entity._id"
          :entity="entity"
          :idx="String(idx)"
          :menu="menu">
          <template v-slot:entityTitle="{ entity }">
            <slot name="entityTitle" :entity="entity" />
          </template>
          <template v-slot:entitySubtitle="{ entity }">
            <slot name="entitySubtitle" :entity="entity" />
          </template>
          <template v-slot:preMenu>
            <slot name="preMenu" />
          </template>
        </list-item-row>
      </a-list>
      <div v-else class="text-grey">
        <slot name="noValue" />
      </div>
    </a-card-text>
    <span v-if="$slots.pagination">
      <slot name="pagination" />
    </span>
  </a-card>
</template>

<script setup>
import { computed, reactive, watch } from 'vue';
import isValid from 'date-fns/isValid';
import parseISO from 'date-fns/parseISO';
import formatDistance from 'date-fns/formatDistance';

import ListItemCard from './ListItemCard.vue';
import ListItemRow from './ListItemRow.vue';
import { useDisplay } from 'vuetify';
import AppNavigationControl from '@/components/AppNavigationControl.vue';

const { mobile } = useDisplay();

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  entities: {
    type: Array,
    required: true,
  },
  listCard: {
    type: Boolean,
    required: false,
    default: false,
  },
  enableFav: {
    type: Boolean,
    required: false,
    default: false,
  },
  pinnedSurveys: {
    type: Array,
    required: false,
  },
  page: {
    type: Number,
    required: false,
  },
  groupStyle: {
    type: Boolean,
    required: false,
    default: false,
  },
  buttonNew: {
    type: Object,
    required: false,
  },
  menu: {
    type: Array,
    required: false,
  },
  showTitle: {
    type: Boolean,
    default: true,
  },
  showSearch: {
    type: Boolean,
    default: true,
  },
  filter: {
    type: Function,
  },
});

const emit = defineEmits(['updateSearch', 'toogleStar']);

const state = reactive({
  searchValue: '',
  showFilter: false,
});

watch(
  () => state.searchValue,
  (val) => {
    emit('updateSearch', val);
  }
);

const entities = computed(() => {
  const now = new Date();
  props.entities.forEach((e) => {
    if (e.meta && !e.createdAgo) {
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
  if (entities.value.length === 0) {
    return [];
  }
  if (!state.searchValue) {
    return entities.value;
  }
  if (entities.value[0].name) {
    return entities.value.filter((entity) => entity.name.toLowerCase().indexOf(state.searchValue.toLowerCase()) > -1);
  } else if (entities.value[0].meta.survey.name) {
    return entities.value.filter(
      (entity) => entity.meta.survey.name.toLowerCase().indexOf(state.searchValue.toLowerCase()) > -1
    );
  }
}
</script>

<style scoped>
.v-card--variant-elevated {
  box-shadow: none !important;
}
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
