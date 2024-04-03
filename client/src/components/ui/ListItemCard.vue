<template>
  <a-hover v-slot="{ isHovering, props }">
    <a-list-item
      :to="menu[0].action(entity)"
      v-bind="props"
      :style="state.groupStyle"
      :elevation="isHovering ? 2 : 0"
      dense
      class="py-2 mb-2 bg-white"
      rounded="lg">
      <span>
        <a-list-item-title class="d-flex align-center">
          <span v-if="enableFav" @click.prevent="toogleStar(entity)">
            <a-icon v-if="isStarred(entity)" class="mr-2">mdi-star</a-icon>
            <a-icon v-if="!isStarred(entity) && isHovering" class="mr-2"> mdi-star-outline </a-icon>
          </span>
          <span v-if="groupStyle">
            <a-avatar class="mr-3" color="accent-lighten-2" rounded="lg" size="35">
              {{ state.avatarName }}
            </a-avatar></span
          >
          {{ state.entity.name }}
        </a-list-item-title>
        <a-list-item-subtitle v-if="!groupStyle">created {{ state.entity.createdAgo }} ago</a-list-item-subtitle>
      </span>
      <a-menu location="start" v-model="state.menuIsOpen[idx]">
        <template v-slot:activator="{ props }">
          <a-icon v-bind="props" @click.prevent>mdi-dots-horizontal</a-icon>
        </template>
        <a-list dense class="py-0">
          <a-list-item
            v-for="(itemMenu, idx) of filteredMenu"
            :key="idx"
            class="d-flex align-center justify-end"
            :style="getTextColor(itemMenu)"
            :to="itemMenu.action(entity)"
            dense>
            {{ itemMenu.title }}
            <a-icon class="ml-2"> {{ itemMenu.icon }} </a-icon>
          </a-list-item>
        </a-list>
      </a-menu>
    </a-list-item>
  </a-hover>
</template>

<script setup>
import { cloneDeep } from 'lodash';
import { reactive, computed, onMounted } from 'vue';

const props = defineProps({
  entity: {
    type: Object,
    required: true,
  },
  idx: {
    type: String,
    required: true,
  },
  // TODO favorite part should be linked/merge with pinned like pinned survey and not done like this
  enableFav: {
    type: Boolean,
    required: false,
    default: false,
  },
  pinnedSurveys: {
    type: Array,
    required: false,
  },
  groupStyle: {
    type: Boolean,
    required: false,
    default: false,
  },
  menu: {
    type: Array,
    required: false,
  },
});

const emit = defineEmits(['toogleStar']);

const state = reactive({
  entity: cloneDeep(props.entity),
  favorite: [],
  menuIsOpen: [],
  groupStyle: {},
  avatarName: '',
});

onMounted(() => {
  if (props.groupStyle) {
    const treeHierarchy = props.entity.dir.split('/').length - 2;
    const defaultIndentation = 20;
    state.groupStyle = {
      marginLeft: `${treeHierarchy * defaultIndentation}px`,
    };

    const name = props.entity.name;
    const names = name.split(' ');
    if (names.length === 1) {
      state.avatarName = name.slice(0, 2).toUpperCase();
    } else if (names.length >= 2) {
      const premiereLettrePremierMot = names[0].charAt(0).toUpperCase();
      const premiereLettreDeuxiemeMot = names[1].charAt(0).toUpperCase();
      state.avatarName = premiereLettrePremierMot + premiereLettreDeuxiemeMot;
    } else {
      state.avatarName = '';
    }
  }
});

const filteredMenu = computed(() => {
  return props.menu.filter((m) => m.render || m.render === undefined);
});

function getTextColor(itemMenu) {
  return { color: itemMenu.color };
}

function isStarred(entity) {
  return props.pinnedSurveys.find((s) => s._id === entity._id);
}

function toogleStar(entity) {
  emit('toogleStar', entity);
}
</script>

<style scoped>
.mdi-star {
  color: #f1b711 !important;
}

.elevation-6 {
  box-shadow: 0px 11px 10px -8px var(--v-shadow-key-umbra-opacity, rgba(0, 0, 0, 1)) !important;
}
</style>
