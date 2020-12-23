<template>
  <div>
    <v-toolbar
      color="grey lighten-4"
      class="flex-grow-0 flex-shrink-0"
      flat
      tile
    >
      <v-toolbar-title
        id="draft-toolbar"
        class="ml-n3"
      >
        <div class="infos grey--text text--darken-2">
          <div class="d-flex">
            <span class="number-chip mr-2">{{ questionNumber }}</span>
          </div>
        </div>
      </v-toolbar-title>

      <v-spacer />

      <v-btn
        icon
        v-if="showOverviewIcon"
        @click="$emit('showOverviewClicked')"
      >
        <v-icon>mdi-format-list-numbered</v-icon>
      </v-btn>

    </v-toolbar>
  </div>

</template>

<script>
export default {
  props: [
    'showOverviewIcon',
    'questionNumber',
    'required',
    'anon',
    'groupPath',
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
