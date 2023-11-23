<template>
  <div>
    <a-card>
      <a-card-title>
        Farm Hub Onboarding
        <a-spacer />
      </a-card-title>
      <a-card-text class="d-flex justify-center">
        <div class="pa-8">
          <a-btn class="center-text" color="primary" priominent x-large :to="newRoute">Manage FarmOS Farms</a-btn>
        </div>
      </a-card-text>
    </a-card>
  </div>
</template>

<script>
export default {
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
