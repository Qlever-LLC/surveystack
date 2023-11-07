<template>
  <div>
    <a-toolbar color="grey lighten-4" flat tile>
      <div class="flex-grow-1 d-flex flex-row justify-space-between maxw-60 mx-auto">
        <a-toolbar-title id="draft-toolbar">
          <div class="infos grey--text text--darken-2">
            <div class="d-flex">
              <span class="number-chip mr-2">{{ questionNumber }}</span>
            </div>
          </div>
        </a-toolbar-title>

        <v-spacer />

        <slot name="toolbar-actions"></slot>

        <v-btn icon v-if="showOverviewIcon" @click="$emit('showOverviewClicked')">
          <v-icon>mdi-format-list-numbered</v-icon>
        </v-btn>
      </div>
    </a-toolbar>
  </div>
</template>

<script>
import AToolbar from '@/components/ui/AToolbar.vue';
import AToolbarTitle from '@/components/ui/AToolbarTitle.vue';
export default {
  components: {
    AToolbar,
    AToolbarTitle,
  },
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
