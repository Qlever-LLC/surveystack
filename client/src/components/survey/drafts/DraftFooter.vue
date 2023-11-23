<template>
  <footer v-if="showNav" class="d-flex align-center">
    <div class="full maxw-60 mx-auto">
      <div v-if="showSubmit" class="d-flex flex-row">
        <div class="half px-1">
          <a-btn
            @click="$store.dispatch('draft/showOverview', false)"
            outlined
            depressed
            large
            color="primary"
            class="full"
          >
            Cancel
          </a-btn>
        </div>

        <div class="half px-1">
          <a-btn :disabled="!enableSubmit" @click="$emit('submit')" depressed large color="primary" class="full">
            Submit
            <span v-if="$store.getters['draft/submission'].meta.submitAsUser"
              >as {{ $store.getters['draft/submission'].meta.submitAsUser.name }} <br
            /></span>
          </a-btn>
        </div>
      </div>
      <div v-else class="d-flex flex-row">
        <div class="half px-1">
          <a-btn v-show="showPrev" @click="$emit('prev')" outlined depressed large color="primary" class="full">
            Previous
          </a-btn>
        </div>
        <div class="half px-1">
          <a-btn :disabled="!enableNext" @click="$emit('next')" depressed large color="primary" class="full">
            Next
          </a-btn>
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
.full {
  width: 100%;
}
.half {
  width: 50%;
}
</style>
