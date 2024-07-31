<template>
  <a-hover v-slot="{ isHovering }">
    <a-list-item
      v-bind="$attrs"
      :style="state.groupStyle"
      :elevation="isHovering ? 2 : 0"
      dense
      class="mb-2 bg-white"
      :class="{ 'py-2': !smallCard, 'py-0': smallCard }"
      rounded="lg"
      @[getDefaultAction()&&`click`]="runDefaultAction()">
      <span style="display: grid">
        <span style="display: contents">
          <a-list-item-title v-if="$slots.entityTitle">
            <slot name="entityTitle" :entity="state.entity" />
          </a-list-item-title>
          <a-list-item-title v-else class="d-flex align-center">
            <span v-if="enablePinned" @click.stop="toogleStar(entity)">
              <a-icon v-if="entity.pinnedSurveys" class="mr-2">mdi-star</a-icon>
              <a-icon v-if="!entity.pinnedSurveys && isHovering" class="mr-2"> mdi-star-outline </a-icon>
            </span>
            <span v-if="groupStyle">
              <a-avatar class="mr-3 entityAvatar_deepCSS" color="accent-lighten-2" rounded="lg" size="35">
                {{ state.avatarName }}
              </a-avatar>
            </span>
            <span class="entityName_deepCSS">
              <span> {{ state.entity.name }}</span>
              <br />
              <span v-if="!smallCard" class="subEntityName_deepCSS">{{ state.entity?.role }}</span>
            </span>
            <span v-if="questionSetsType">
              <a-icon class="ml-2 my-2">mdi-note-multiple-outline</a-icon>
              {{ state.entity.meta.libraryUsageCountSubmissions ? state.entity.meta.libraryUsageCountSubmissions : 0 }}
              <a-tooltip bottom activator="parent">Number of submission using this</a-tooltip>
            </span>
          </a-list-item-title>
        </span>
        <a-list-item-subtitle v-if="$slots.entitySubtitle && !state.entity.createdAgo">
          <slot name="entitySubtitle" :entity="state.entity" />
        </a-list-item-subtitle>
        <a-list-item-subtitle v-else-if="!groupStyle">created {{ state.entity.createdAgo }} ago</a-list-item-subtitle>
      </span>
      <a-spacer />
      <slot name="preMenu" :entity="state.entity" />
      <a-menu v-if="!groupSelectorStyle && filteredMenu?.length > 0" location="start" v-model="state.menuIsOpen[idx]">
        <template v-slot:activator="{ props }">
          <a-btn v-bind="props" icon @click.prevent :small="smallCard"><a-icon>mdi-dots-horizontal</a-icon></a-btn>
        </template>
        <a-list dense class="py-0">
          <a-list-item
            v-for="(itemMenu, idx) of filteredMenu"
            :key="idx"
            class="d-flex align-center justify-end"
            :style="getTextColor(itemMenu)"
            dense
            @click="runAction(itemMenu.action(entity))">
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
import { useRouter } from 'vue-router';

const router = useRouter();

const props = defineProps({
  entity: {
    type: Object,
    required: true,
  },
  idx: {
    type: String,
    required: true,
  },
  enablePinned: {
    type: Boolean,
    required: false,
    default: false,
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
  menu: {
    type: Array,
    required: false,
  },
  groupSelectorStyle: {
    type: Boolean,
    required: false,
    default: false,
  },
  smallCard: {
    type: Boolean,
    required: false,
    default: false,
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
  return props.menu?.filter((m) => m.render === undefined || m.render(props.entity)());
});

function getTextColor(itemMenu) {
  return { color: itemMenu.color };
}

function toogleStar(entity) {
  emit('toogleStar', entity);
}

function getDefaultAction() {
  //find first renderable default menu item, defined by color='green'
  let defaultMenuItem = null;
  for (const item of props.menu) {
    if (item.color === 'green' && (item.render === undefined || item.render(props.entity)())) {
      defaultMenuItem = item;
      break;
    }
  }
  return defaultMenuItem;
}

function runDefaultAction() {
  let defaultMenuItem = getDefaultAction();
  if (defaultMenuItem) {
    runAction(defaultMenuItem.action(props.entity));
  }
}

function runAction(action) {
  if (typeof action == 'function') {
    action();
  } else if (typeof action == 'string' || typeof action == 'object') {
    router.push(action);
  } else {
    console.error('unknown type of action: ' + action);
  }
}
</script>

<style scoped>
.mdi-star {
  color: #f1b711 !important;
}

.elevation-6 {
  box-shadow: 0px 11px 10px -8px var(--v-shadow-key-umbra-opacity, rgba(0, 0, 0, 1)) !important;
}

.entityName_deepCSS {
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}
</style>
