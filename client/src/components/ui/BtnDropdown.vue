<template>
  <div class="text-center">
    <a-btn v-bind="$attrs" class="main-button"> {{ label }} </a-btn>
    <a-menu v-if="showDropDown" v-model="menuIsOpen" location="bottom" class="pa-0 ma-0 right">
      <template v-slot:activator="{ props }">
        <a-btn v-bind="{ ...$attrs, ...props }" class="dropdown-button"><a-icon>mdi-chevron-down</a-icon></a-btn>
      </template>
      <slot></slot>
    </a-menu>
  </div>
</template>

<script>
export default {
  name: 'BtnDropdown',
  inheritAttrs: false,
  props: {
    label: {
      type: String,
      required: true,
    },
    showDropDown: {
      type: Boolean,
      default: true,
    },
  },
  emit: ['click'],
  data() {
    return {
      menuIsOpen: false,
    };
  },
};
</script>

<style scoped lang="scss">
.main-button {
  border-top-right-radius: 0px;
  border-bottom-right-radius: 0px;
}
.dropdown-button {
  max-width: 20px !important;
  min-width: 0 !important;
  border-top-left-radius: 0px;
  border-bottom-left-radius: 0px;
  margin-left: 2px !important;
}
</style>
