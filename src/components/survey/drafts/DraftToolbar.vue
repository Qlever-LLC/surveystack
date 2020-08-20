<template>
  <div>
    <v-toolbar
      color="grey lighten-4"
      class="flex-grow-0 flex-shrink-0"
      flat
      tile
    >
      <v-toolbar-title id="draft-toolbar">
        <div class="infos grey--text text--darken-2">
          <div class="d-flex">
            <span class="number-chip mr-2">{{ questionNumber }}</span>
          </div>
        </div>
      </v-toolbar-title>

      <v-spacer></v-spacer>
      <v-chip
        v-if="required"
        dark
        color="error"
      >
        <span class="font-weight-bold">
          <v-icon class="mr-2">mdi-alert-circle</v-icon>Answer required
        </span>
      </v-chip>
      <v-spacer></v-spacer>

      <!-- <v-btn icon>
      <v-icon>mdi-magnify</v-icon>
    </v-btn> -->

      <v-btn
        icon
        v-if="showOverviewIcon"
        @click="$emit('showOverviewClicked')"
      >
        <v-icon>mdi-format-list-numbered</v-icon>
      </v-btn>

      <!-- <v-btn icon>
      <v-icon>mdi-dots-vertical</v-icon>
    </v-btn> -->
    </v-toolbar>

    <div
      color="grey lighten-4"
      class="flex-grow-0 flex-shrink-0 pt-1"
    >
      <v-chip
        v-if="group"
        class="mr-2 mb-1"
        dark
        color="secondary"
      >
        <span class="font-weight-bold">
          <v-icon class="mr-2">mdi-account-multiple</v-icon> {{ group }}
        </span>
      </v-chip>
      <v-chip
        v-if="anon"
        class="mr-2"
        dark
        color="primary"
      >
        <span class="font-weight-bold">
          <v-icon class="mr-2">mdi-eye</v-icon>This answer is private
        </span>
      </v-chip>
    </div>
  </div>

</template>

<script>
export default {
  props: [
    'showOverviewIcon',
    'questionNumber',
    'required',
    'anon',
    'group',
  ],
};
</script>

<style scoped>
.number-chip {
  display: inline-flex;
  /* border: 2px solid #ff5722; */
  border: 2px solid currentColor;
  background-color: white;
  /* color: #ff5722; */
  border-radius: 2rem;
  line-height: 2rem;
  font-weight: bold;
  font-size: 2rem;
  padding: 0.4rem;
  padding-left: 0.8rem;
  padding-right: 0.9rem;
}
</style>
