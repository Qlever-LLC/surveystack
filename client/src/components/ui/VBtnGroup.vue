<!-- Vue3 will have a component for this -->

<template>
  <v-item-group class="v-btn-group">
    <slot />
  </v-item-group>
</template>

<style lang="scss">
.v-btn-group {
  border-radius: 2px;
  display: inline-flex;

  .v-btn {
    border-radius: 0;
    justify-content: center;
    margin: 0;
    min-width: auto;
    padding: 0 8px;
    width: auto;

    &:not(:last-child) {
      border-right: 1px solid transparent;
    }
    &:first-child {
      border-radius: 2px 0 0 2px;
    }
    &:last-child {
      border-radius: 0 2px 2px 0;
    }
  }
}
</style>