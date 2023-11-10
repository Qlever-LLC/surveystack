<template>
  <div>
    <a-card>
      <v-card-title>
        Farm Hub Onboarding
        <v-spacer />
      </v-card-title>
      <v-card-text class="d-flex justify-center">
        <div class="pa-8">
          <v-btn class="center-text" color="primary" priominent x-large :to="newRoute">Manage FarmOS Farms</v-btn>
        </div>
      </v-card-text>
    </a-card>
  </div>
</template>

<script>
import ACard from '@/components/ui/ACard.vue';
export default {
  components: {
    ACard,
  },
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
