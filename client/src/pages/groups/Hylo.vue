<template>
  <a-col cols="12" lg="6">
    <v-card v-if="$route.params.id" class="mb-4">
      <app-hylo-integration-card :groupId="$route.params.id" />
    </v-card>
  </a-col>
</template>
<script>
import appHyloIntegrationCard from '@/components/integrations/HyloIntegrationCard.vue';
import ACol from '@/components/ui/ACol.vue';

export default {
  components: {
    appHyloIntegrationCard,
    ACol,
  },
};
</script>
