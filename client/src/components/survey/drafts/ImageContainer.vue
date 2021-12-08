<template>
  <div :style="style" class="background"></div>
</template>

<script>
export default {
  props: {
    imageDesktop: String,
    imageMobile: String,
    imageFallbackColor: String,
  },
  watch: {
    imageDesktop: function(newVal) {
      this.imgDesktop = newVal;
    },
    imageMobile: function(newVal) {
      this.imgMobile = newVal;
    },
    imageFallbackColor: function(newVal) {
      this.imgFallbackColor = newVal;
    },
  },
  data() {
    return {
      imgDesktop: this.imageDesktop,
      imgMobile: this.imageMobile,
      imgFallbackColor: this.imageFallbackColor,
    };
  },
  computed: {
    style() {
      if (this.$vuetify.breakpoint.smAndDown) {
        return `backgroundImage: url( ${this.imgMobile} ); background-color: ${this.imgFallbackColor} !important`;
      } else {
        return `background-image: url( ${this.imgDesktop} ); background-color: ${this.imgFallbackColor} !important`;
      }
    },
  },
};
</script>

<style scoped>
.background {
  background-repeat: no-repeat;
  background-position: center center;
  background-size: cover;
}
@media (min-width: 960px) {
  .background {
    height: 100vh;
    position: sticky;
    top: 0;
  }
}
</style>
