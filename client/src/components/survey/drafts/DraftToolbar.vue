<template>
  <v-toolbar color="grey lighten-4" flat tile class="pr-0 draft-toolbar">
    <div class="flex-grow-1 d-flex flex-row justify-space-between align-center mx-auto">
      <v-toolbar-title id="draft-toolbar">
        {{ questionNumber }}
      </v-toolbar-title>

      <v-spacer />

      <slot name="toolbar-actions"></slot>

      <v-btn icon v-if="showOverviewIcon" @click="$emit('showOverviewClicked')" class="mr-n3">
        <v-icon v-if="!overviewIsVisible">mdi-text-box-check-outline</v-icon>
        <v-icon v-else>mdi-close</v-icon>
      </v-btn>
    </div>
  </v-toolbar>
</template>

<script>
export default {
  props: {
    showOverviewIcon: {
      type: Boolean,
    },
    questionNumber: {
      type: String,
    },
    required: {
      type: Boolean,
    },
    anon: {
      type: Boolean,
    },
    groupPath: {
      type: String,
    },
    overviewIsVisible: {
      type: Boolean,
    },
  },
  // watch: {
  //   overviewIsVisible(o, n) {
  //     console.log('old', o, 'new', n)
  //   }
  // },
};
</script>

<style scoped>
.draft-toolbar >>> .v-toolbar__content {
  padding-right: 0;
}
</style>
