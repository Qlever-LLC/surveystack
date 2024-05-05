<template>
  <a-snackbar
    :modelValue="modelValue"
    @update:modelValue="handleInput"
    :timeout="-1"
    color="primary lighten-1"
    position="fixed"
    location="bottom"
    cssIosSnackbar>
    <a-btn @click="handleClose" icon class="close-button">
      <a-icon>mdi-close</a-icon>
    </a-btn>
    <div class="text-center wrapper">
      <h2>Install App</h2>
      <div class="d-flex align-center justify-center">
        Just tap
        <img src="./ios-safari-center-icon.svg" alt="" class="icon" />
        then Add To Homescreen
        <img src="./ios-safari-add-icon.svg" alt="" class="icon" />
      </div>
    </div>
  </a-snackbar>
</template>

<script>
export default {
  props: {
    modelValue: Boolean,
  },
  methods: {
    handleInput(ev) {
      this.$emit('update:modelValue', ev);
    },
    handleClose() {
      this.$emit('update:modelValue', false);
      localStorage.setItem('iosInstallBannerDismissed', true);
    },
  },
};
</script>

<style scoped lang="scss">
.icon {
  height: 1.5rem;
  display: inline-block;
  margin: 0 0.5rem;
}

.wrapper {
  width: 100%;
}

.close-button {
  position: absolute;
  right: 10px;
  top: 3px;
}
</style>
