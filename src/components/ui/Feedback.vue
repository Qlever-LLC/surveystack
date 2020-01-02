<template>
  <div class="alert alert-dismissible fade show" :class="`alert-${type}`" role="alert">
    <strong class="mr-1">{{title}}</strong>
    <slot />
    <button
      type="button"
      class="close"
      data-dismiss="alert"
      aria-label="Close"
      @click="$emit('closed')"
    >
      <span aria-hidden="true">&times;</span>
    </button>
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      default: 'Error!',
    },
    type: {
      type: String,
      default: 'warning',
      required: false,
    },
  },
};
</script>
