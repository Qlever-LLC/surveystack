<template>
  <v-banner color="red lighten-2" dark class="mx-0 px-0">
    <div class="d-flex align-center">
      <a-icon small left>mdi-alert</a-icon>
      <div>
        <slot>Unknown error</slot>
      </div>
    </div>
  </v-banner>
</template>
<script>
import AIcon from '@/components/ui/AIcon.vue';

export default {
  components: { AIcon },
};
</script>
