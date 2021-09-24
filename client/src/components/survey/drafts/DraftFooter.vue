<template>
  <footer v-if="showNav" class="d-flex align-center">
    <div class="maxw-60">
      <div v-if="showSubmit" class="d-flex flex-row">
        <div class="px-1">
          <v-btn
            @click="$store.dispatch('draft/showOverview', false)"
            outlined
            depressed
            small
            color="primary"
            class="px-10"
          >
            Cancel
          </v-btn>
        </div>

        <div class="px-1">
          <v-btn :disabled="!enableSubmit" @click="$emit('submit')" depressed small color="primary" class="px-10">
            Submit
          </v-btn>
        </div>
      </div>
      <div v-else class="d-flex flex-row">
        <div class="px-1">
          <v-btn v-show="showPrev" @click="$emit('prev')" outlined depressed small color="primary" class="px-10">
            Previous
          </v-btn>
        </div>
        <div class="px-1">
          <v-btn :disabled="!enableNext" @click="$emit('next')" depressed small color="primary" class="px-10">
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
