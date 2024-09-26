<template>
  <v-hover>
    <template v-slot:default="{ isHovering, props }">
      <slot name="default" :isHovering="isHovering" :props="props" />
    </template>
  </v-hover>
</template>

<script setup></script>
