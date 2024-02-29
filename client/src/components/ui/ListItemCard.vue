<template>
  <a-hover v-slot="{ isHovering, props }">
    <a-list-item
      v-bind="props"
      :elevation="isHovering ? 6 : 2"
      dense
      class="bg-primary py-2 mb-1"
      rounded="lg"
      @mouseover="mouseover(idx)"
      @mouseleave="mouseleave(idx)">
      <span>
        <a-list-item-title style="display: flex; align-items: flex-end">
          <span v-if="enableFav" @click="toogleFavorite(idx)">
            <a-icon v-if="state.favorite[idx]" class="mr-2">mdi-star</a-icon>
            <a-icon v-if="!state.favorite[idx] && state.isHover[idx]" class="mr-2"> mdi-star-outline </a-icon>
          </span>
          {{ state.entity.name }}
        </a-list-item-title>
        <a-list-item-subtitle>created {{ state.entity.createdAgo }} ago</a-list-item-subtitle>
      </span>
      <span>
        <a-menu location="start" v-model="state.menuIsOpen[idx]">
          <template v-slot:activator="{ props }">
            <a-icon v-bind="props">mdi-dots-horizontal</a-icon>
          </template>
          <a-list>
            <a-list-item class="d-flex align-center"> to do </a-list-item>
          </a-list>
        </a-menu>
      </span>
    </a-list-item>
  </a-hover>
</template>

<script setup>
import { cloneDeep } from 'lodash';
import { reactive } from 'vue';

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
});

const state = reactive({
  entity: cloneDeep(props.entity),
  favorite: [],
  menuIsOpen: [],
  isHover: [],
});

function mouseover(idx) {
  state.isHover[idx] = true;
}
function mouseleave(idx) {
  state.isHover[idx] = false;
}

function toogleFavorite(idx) {
  state.favorite[idx] = !state.favorite[idx];
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
