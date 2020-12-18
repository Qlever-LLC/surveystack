<template>
  <v-banner
    color="red lighten-2"
    dark
    class="mx-0 px-0"
  >
    <div class="d-flex align-center">
      <v-icon
        small
        left
      >mdi-alert</v-icon>
      <div>
        <slot>Unknown error</slot>
      </div>
    </div>
  </v-banner>
</template>
