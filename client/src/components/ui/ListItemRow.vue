<template>
  <a-hover v-slot="{ isHovering, props }">
    <a-list-item v-bind="props" :class="{ innerShadow: isHovering }">
      <span>
        <a-list-item-title class="d-flex align-center">
          {{ state.entity.meta.survey.name }}
        </a-list-item-title>
        <a-list-item-subtitle>Submitted {{ state.entity.meta.dateSubmitted.$date }}</a-list-item-subtitle>
      </span>
      <a-spacer />
      <a-btn x-small class="mr-2 pa-0" color="blue" variant="outlined"> Proxy </a-btn>
      <a-col v-if="drafts">
        <slot name="preMenu" />
      </a-col>
      <a-btn v-if="submissions && isHovering" small class="mr-2" color="green" variant="outlined"> Resubmit </a-btn>

      <a-btn v-if="drafts" small class="mr-2" color="green" variant="outlined" :class="{ onhoverBtn: isHovering }">
        Continue
      </a-btn>
      <a-menu location="start" v-model="state.menuIsOpen[idx]">
        <template v-slot:activator="{ props }">
          <a-icon v-bind="props">mdi-dots-horizontal</a-icon>
        </template>
        <a-list dense class="py-0">
          <a-list-item
            v-for="(itemMenu, idx) of menu"
            :key="idx"
            class="d-flex align-center justify-end"
            :style="getTextColor(itemMenu)"
            :to="itemMenu.action"
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
  menu: {
    type: Array,
    required: false,
  },
  submissions: {
    type: Boolean,
    required: false,
  },
  drafts: {
    type: Boolean,
    required: false,
  },
});

const state = reactive({
  entity: cloneDeep(props.entity),
  menuIsOpen: [],
});

function getTextColor(itemMenu) {
  return { color: itemMenu.color };
}
</script>

<style scoped>
.innerShadow {
  box-shadow: rgba(93, 101, 189, 0.2) 0px -50px 36px -28px inset;
}
.onhoverBtn {
  background-color: green;
  color: white !important;
}
</style>
