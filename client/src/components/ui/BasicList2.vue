<template>
  <a-card :loading="loading" color="background" class="cardStyle">
    <a-card-title v-if="showTitle" class="text-heading pa-4">
      <a-row class="d-flex">
        <a-col v-if="showNavigationControl" class="flex-grow-0">
          <AppNavigationControl />
        </a-col>
        <a-col v-else class="flex-grow-0">
          {{ title }}
        </a-col>
        <a-col class="flex-grow-1 pl-0" :class="mobile ? 'text-center' : 'text-center'">
          <slot name="title" />
        </a-col>
        <a-col class="flex-grow-0">
          <slot name="titleBtn" />
          <a-btn v-if="buttonNew?.title" color="accent" :to="buttonNew.link" variant="flat" rounded="lg">
            <a-icon class="mdi-24px"> mdi-plus-circle-outline </a-icon>
            <div v-if="!mobile" class="ml-2">{{ buttonNew.title }}</div>
          </a-btn>
        </a-col>
      </a-row>
      <slot name="customTypeList" />
    </a-card-title>
    <a-card-text>
      <span v-if="showSearch" class="d-flex mb-6">
        <a-text-field
          v-model="state.searchValue"
          bgColor="transparent"
          dense
          hideDetails
          :label="labelSearch"
          prependInnerIcon="mdi-magnify"
          rounded="lg"
          variant="solo-filled"
          clearable />
        <a-btn
          v-if="$slots.filter"
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
      <template v-if="listType === 'card' && (filteredEntities.length > 0 || loading)">
        <div v-if="loading">
          <a-skeleton-loader v-for="index in [1, 2, 3]" :key="index" type="list-item" :height="57" class="mb-2" />
        </div>
        <a-list v-else dense twoLine class="pt-0">
          <list-item-card
            v-for="(entity, idx) in filteredEntities"
            :key="entity._id"
            @toogleStar="$emit('toogleStar', entity)"
            :entity="entity"
            :idx="String(idx)"
            :enablePinned="enablePinned"
            :groupStyle="groupStyle"
            :questionSetsType="questionSetsType"
            :menu="menu">
            <template v-slot:entitySubtitle="{ entity }">
              <slot name="entitySubtitle" :entity="entity" />
            </template>
            <template v-slot:preMenu="{ entity }">
              <slot name="preMenu" :entity="entity" />
            </template>
          </list-item-card>
        </a-list>
      </template>
      <template v-else-if="(listType === 'row' && filteredEntities.length > 0) || loading">
        <div v-if="loading" class="py-2">
          <a-skeleton-loader
            v-for="index in [1, 2, 3]"
            :key="index"
            type="list-item"
            class="light-border"
            :height="52"
            color="background" />
        </div>
        <a-list v-else>
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
      </template>
      <template v-else-if="listType === 'custom' || loading">
        <slot name="customList" />
      </template>
      <div v-else class="text-grey">
        <slot name="noValue" />
      </div>
    </a-card-text>
    <span v-if="$slots.pagination">
      <slot name="pagination" />
    </span>
    <slot />
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
import ASkeletonLoader from '@/components/ui/elements/ASkeletonLoader.vue';

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
  listType: {
    type: String,
    validator: function (value) {
      return ['row', 'card', 'custom'].includes(value);
    },
    required: false,
    default: 'row',
  },
  enablePinned: {
    type: Boolean,
    required: false,
    default: false,
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
  questionSetsType: {
    type: Boolean,
    required: false,
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
  labelSearch: {
    type: String,
    default: 'Search',
  },
  filter: {
    type: Function,
  },
  showNavigationControl: {
    type: Boolean,
    default: true,
  },
  title: {
    type: String,
    default: 'List',
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
  //TODO there should be no content specific code in this component. extract this logic by adding a prop "filterFn". If not defined, try filtering by name, otherwise call the filterFn
  if (entities.value.length === 0) {
    return [];
  }
  if (!state.searchValue) {
    return entities.value;
  }
  if (entities.value[0].name) {
    return entities.value.filter((entity) => entity.name.toLowerCase().indexOf(state.searchValue.toLowerCase()) > -1);
  } else if (entities.value[0]?.meta?.survey?.name) {
    return entities.value.filter(
      (entity) => entity.meta.survey.name.toLowerCase().indexOf(state.searchValue.toLowerCase()) > -1
    );
  } else if (entities.value[0]?.user?.name) {
    return entities.value.filter(
      (entity) =>
        entity.user?.name.toLowerCase().indexOf(state.searchValue.toLowerCase()) > -1 ||
        entity.user?.email.toLowerCase().indexOf(state.searchValue.toLowerCase()) > -1
    );
  }
}
</script>

<style scoped>
.cardStyle {
  height: 100%;
}

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

.light-border {
  border-bottom: 1px solid lightgray;
  border-top: 1px solid lightgray;
}
</style>
