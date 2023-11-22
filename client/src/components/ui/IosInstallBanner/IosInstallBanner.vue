<template>
  <a-snackbar :value="value" @input="handleInput" :timeout="-1" color="primary lighten-1" fixed bottom cssIosSnackbar>
    <v-btn @click="handleClose" icon class="close-button">
      <v-icon>mdi-close</v-icon>
    </v-btn>
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
    value: Boolean,
  },
  methods: {
    handleInput(ev) {
      this.$emit('input', ev);
    },
    handleClose() {
      this.$emit('input', false);
      localStorage.setItem('iosInstallBannerDismissed', true);
    },
  },
};
</script>

<style scoped>
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
