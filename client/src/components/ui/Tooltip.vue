<template>
  <v-tooltip bottom>
    <template v-slot:activator="{ on, attrs }">
      <v-icon color="primary" v-bind="attrs" v-on="on">mdi-information</v-icon>
    </template>
    <span> <slot></slot> </span>
  </v-tooltip>
</template>
