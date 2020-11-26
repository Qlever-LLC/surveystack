<template>
  <div>
    <v-card>
      <v-card-title>
        Farm Hub Onboarding
        <v-spacer />
      </v-card-title>
      <v-card-text class="d-flex justify-center">
        <div class="pa-8">
          <v-btn
            class="center-text"
            color="primary"
            priominent
            x-large
            :to="newRoute"
          >Manage FarmOS Farms</v-btn>
        </div>
      </v-card-text>
    </v-card>

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
