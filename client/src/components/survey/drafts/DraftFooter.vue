<template>
  <footer v-if="showNav" class="d-flex align-center" color="white">
    <div class="full-width maxw-60 mr-auto">
      <div v-if="showSubmit" class="d-flex justify-space-between full-width overview-footer">
        <div class="px-1">
          <v-btn
            @click="$store.dispatch('draft/showOverview', false)"
            outlined
            depressed
            large
            color="primary"
            class="button text-body-1"
          >
            Cancel
          </v-btn>
        </div>

        <div class="px-1">
          <v-btn
            :disabled="!enableSubmit"
            @click="$emit('submit')"
            depressed
            large
            color="primary"
            class="button text-body-1"
          >
            Submit
          </v-btn>
        </div>
      </div>
      <div v-else class="d-flex justify-space-between">
        <div class="px-1">
          <v-btn
            :disabled="!showPrev"
            @click="$emit('prev')"
            outlined
            depressed
            large
            color="primary"
            class="button text-body-1"
          >
            Previous
          </v-btn>
        </div>
        <div class="px-1">
          <v-btn
            :disabled="!enableNext"
            @click="$emit('next')"
            depressed
            large
            color="primary"
            class="button text-body-1"
          >
            Next
          </v-btn>
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  props: ['showPrev', 'enableNext', 'enableSubmit', 'showSubmit', 'showNav'],
};
</script>
<style scoped>
.button {
  text-transform: none;
}
.v-btn.button {
  min-width: 110px;
}
</style>
