<template>
  <footer v-if="showNav">
    <v-container class="pa-0">
      <v-row>
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
          v-if="showSubmit"
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
            Submit
          </v-btn>
        </v-col>

        <v-col
          v-else
          class="text-center"
          cols="6"
        >
          <v-btn
            :disabled="!enableNext"
            @click="$emit('submit');"
            @keyup.enter="$emit('submit');"
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
