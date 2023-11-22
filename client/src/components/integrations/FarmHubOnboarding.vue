<template>
  <div>
    <a-card>
      <a-card-title>
        Farm Hub Onboarding
        <a-spacer />
      </a-card-title>
      <a-card-text class="d-flex justify-center">
        <div class="pa-8">
          <v-btn class="center-text" color="primary" priominent x-large :to="newRoute">Manage FarmOS Farms</v-btn>
        </div>
      </a-card-text>
    </a-card>
  </div>
</template>

<script>
import ACard from '@/components/ui/ACard.vue';
import ACardText from '@/components/ui/ACardText.vue';
import ACardTitle from '@/components/ui/ACardTitle.vue';

export default {
  components: {
    ACard,
    ACardText,
    ACardTitle,
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
