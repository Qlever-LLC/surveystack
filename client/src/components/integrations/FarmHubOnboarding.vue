<template>
  <div>
    <v-card>
      <v-card-title>
        Farm Hub Onboarding
        <a-spacer />
      </v-card-title>
      <v-card-text class="d-flex justify-center">
        <div class="pa-8">
          <a-btn class="center-text" color="primary" priominent x-large :to="newRoute">Manage FarmOS Farms</a-btn>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import ABtn from '@/components/ui/ABtn.vue';

export default {
  components: { ABtn },
  props: {
    entities: {
      type: Array,
    },
    newRoute: {
      type: Object,
    },
  },
};
</script>
