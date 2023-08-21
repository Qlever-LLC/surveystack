<template>
  <v-tooltip bottom>
    <template v-slot:activator="{ on, attrs }">
      <a-icon color="primary" dark v-bind="attrs" v-on="on">mdi-information</a-icon>
    </template>
    <span> <slot></slot> </span>
  </v-tooltip>
</template>
<script>
import AIcon from '@/components/ui/AIcon.vue';

export default {
  components: { AIcon },
};
</script>
