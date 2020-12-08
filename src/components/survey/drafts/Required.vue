<template>

  <v-tooltip bottom>
    <template v-slot:activator="{ on, attrs }">
      <v-icon
        small
        color="red darken-2"
        v-bind="attrs"
        v-on="on"
        class="ml-1"
      >mdi-asterisk</v-icon>

    </template>
    <span>Required</span>
  </v-tooltip>
</template>
