<template>
  <div>
    <v-toolbar color="grey lighten-4" flat tile>
      <div class="flex-grow-1 d-flex flex-row justify-space-between maxw-60 mx-auto">
        <v-toolbar-title id="draft-toolbar" v-if="questionNumber">
          <div class="infos grey--text text--darken-2">
            <div class="d-flex">
              <span class="number-chip mr-2">{{ questionNumber }}</span>
            </div>
          </div>
        </v-toolbar-title>

        <v-spacer />

        <slot name="toolbar-actions"></slot>

        <v-btn icon v-if="showOverviewIcon" @click="$emit('showOverviewClicked')">
          <v-icon>mdi-format-list-numbered</v-icon>
        </v-btn>
      </div>
    </v-toolbar>
  </div>
</template>

<script>
export default {
  props: ['showOverviewIcon', 'questionNumber', 'required', 'anon', 'groupPath'],
};
</script>

<style scoped>
.number-chip {
  display: inline-flex;
  border: 2px solid currentColor;
  background-color: white;
  border-radius: 2rem;
  line-height: 2rem;
  font-weight: bold;
  font-size: 2rem;
  padding: 0.4rem;
  padding-left: 0.8rem;
  padding-right: 0.9rem;
}
</style>
