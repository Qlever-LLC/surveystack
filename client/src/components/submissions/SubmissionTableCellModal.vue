<template>
  <span class="modal" role="dialog">
    <div class="overlay" @click.stop="$emit('close', $event.target.value)" data-testid="overlay"></div>
    <div class="modal-content" :style="{ left: `${left}px`, top: `${top}px` }">
      <span class="font-weight-regular">
        {{ value }}
      </span>
      <copy-to-clipboard v-if="showCopyButton" :value="value" />
    </div>
  </span>
</template>
<script>
import CopyToClipboard from './CopyToClipboard.vue';

export default {
  components: {
    CopyToClipboard,
  },
  props: {
    value: {
      type: String,
    },
    showCopyButton: {
      type: Boolean,
      default: false,
    },
    left: {
      type: Number,
    },
    top: {
      type: Number,
    },
  },
};
</script>
<style scoped lang="scss">
.modal {
  height: 0;
  width: 0;
}
.modal-content {
  box-shadow:
    0 10px 20px rgba(0, 0, 0, 0.19),
    0 6px 6px rgba(0, 0, 0, 0.23);
  background-color: white;
  width: 100%;
  padding: 0.5rem;
  white-space: initial;
  font-size: 0.875rem;
  position: absolute;
  transform: translate(-70px, calc(-100% - 4px));
  min-height: 40px;
  max-height: 150px;
  width: 400px;
  overflow-y: auto;
}
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}
</style>
