<template>
  <a-hover v-slot="{ isHovering, props }">
    <a-list-item v-bind="props" :class="{ innerShadow: isHovering }" class="light-border">
      <span>
        <a-list-item-title class="d-flex align-center">
          <slot name="entityTitle" :entity="entity" />
        </a-list-item-title>
        <a-list-item-subtitle>
          <slot name="entitySubtitle" :entity="entity" />
        </a-list-item-subtitle>
      </span>
      <a-spacer />
      <a-col>
        <slot name="preMenu" />
      </a-col>
      <template v-if="isHovering">
        <a-btn
          v-for="button in actionButtonsHover"
          :key="button.title"
          x-small
          class="mr-2 py-0 px-1"
          :color="button.color"
          variant="outlined"
          @click="runAction(button.action(entity))">
          {{ button.title }}
        </a-btn>
      </template>
      <a-btn
        v-for="button in actionButtonsFixed"
        :key="button.title"
        x-small
        class="mr-2 py-0 px-1"
        :color="button.color"
        variant="outlined"
        @click="runAction(button.action(entity))">
        {{ button.title }}
      </a-btn>
      <a-menu v-if="menu" location="start" v-model="state.menuIsOpen[idx]">
        <template v-slot:activator="{ props }">
          <a-icon v-bind="props">mdi-dots-horizontal</a-icon>
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
            <a-icon class="ml-2"> {{ itemMenu.icon }}</a-icon>
          </a-list-item>
        </a-list>
      </a-menu>
    </a-list-item>
  </a-hover>
</template>

<script setup>
import { computed, reactive } from 'vue';
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
  menu: {
    type: Array,
    required: false,
  },
});

const state = reactive({
  menuIsOpen: [],
});

const filteredMenu = computed(() => {
  return props.menu.filter((m) => m.render === undefined || m.render(props.entity)());
});

const actionButtonsFixed = computed(() => {
  return filteredMenu.value.filter((m) => m.buttonFixed === true);
});

const actionButtonsHover = computed(() => {
  return filteredMenu.value.filter((m) => m.buttonHover === true);
});

function getTextColor(itemMenu) {
  return { color: itemMenu.color };
}

function runAction(action) {
  if (typeof action == 'function') {
    action();
  } else if (typeof action == 'string') {
    router.push(action);
  } else {
    console.error('unknown type of action: ' + action);
  }
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

.light-border {
  border-bottom: 1px solid lightgray;
  border-top: 1px solid lightgray;
}
</style>
