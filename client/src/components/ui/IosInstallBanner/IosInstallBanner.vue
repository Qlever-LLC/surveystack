<template>
  <v-snackbar :value="value" @input="handleInput" :timeout="-1" color="primary lighten-1" fixed bottom class="snackbar">
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
  </v-snackbar>
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

.snackbar {
  height: auto !important;
}

.snackbar >>> .v-snack__content {
  position: relative;
}

.snackbar >>> .v-snack__content::after {
  content: '';
  width: 0;
  height: 0;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-top: 8px solid var(--v-primary-lighten1);
  position: fixed;
  bottom: 0;
  left: 50%;
  margin-left: -12px;
}

.close-button {
  position: absolute;
  right: 10px;
  top: 3px;
}
</style>
