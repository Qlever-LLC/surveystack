<template>

  <v-tooltip bottom>
    <template v-slot:activator="{ on, attrs }">
      <v-icon
        small
        color="primary lighten-1"
        v-bind="attrs"
        v-on="on"
      >mdi-eye-off</v-icon>

    </template>
    <span>Private</span>
  </v-tooltip>
</template>
