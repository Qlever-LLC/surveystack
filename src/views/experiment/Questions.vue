<template>
  <v-container class="pl-8 pr-8 ">

    <app-map></app-map>

  </v-container>
</template>

<script>
import AppMap from '@/components/survey/question_types/Map.vue';

export default {
  components: {
    AppMap,
  },
};
</script>
