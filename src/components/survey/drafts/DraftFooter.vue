<template>
  <footer v-if="showNav">
    <v-container class="pa-0">
      <v-row v-if="showSubmit">
        <v-col
          class="text-center"
          cols="6"
        >
          <v-btn
            @click="$store.dispatch('draft/showOverview', false)"
            class="full"
            outlined
            depressed
            large
            color="primary"
          >
            Cancel
          </v-btn>
        </v-col>
        <v-col
          class="text-center"
          cols="6"
        >
          <v-btn
            :disabled="!enableSubmit"
            @click="$emit('submit');"
            class="full"
            depressed
            large
            color="primary"
          >
            Submit
          </v-btn>
        </v-col>
      </v-row>

      <v-row v-else>
        <v-col
          class="text-center"
          cols="6"
        >
          <v-btn
            v-show="showPrev"
            @click="$emit('prev');"
            class="full"
            outlined
            depressed
            large
            color="primary"
          >
            Previous
          </v-btn>
        </v-col>
        <v-col
          class="text-center"
          cols="6"
        >
          <v-btn
            :disabled="!enableNext"
            @click="$emit('next');"
            class="full"
            depressed
            large
            color="primary"
          >
            Next
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </footer>
</template>


<script>
export default {
  props: [
    'showPrev',
    'enableNext',
    'enableSubmit',
    'showSubmit',
    'showNav',
  ],
};
</script>
<style scoped>
.full {
  width: 100%;
}
</style>
