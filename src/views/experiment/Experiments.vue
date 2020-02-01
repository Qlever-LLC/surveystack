<template>
  <div
    id="screen-root"
    style="width: 100%; height: 100%; padding: 0px !important; margin: 0px;"
  >
    <div
      class="dflex pa-4 align-center"
      j
      style="width: 100%"
    >
      <v-btn
        dark
        primary
        color="blue"
        large
        @click="show=!show"
      > show</v-btn>
    </div>
    <transition :name="slide">
      <v-container
        :key="show"
        style="position: absolute; will-change: transform"
        fluid
        height="100%"
      >
        <v-alert
          v-if="show"
          class="ma-10 pa-12"
          dark
          color="red"
          prominent
        >Hello</v-alert>

        <v-alert
          v-else
          class="ma-10 pa-12"
          dark
          color="green"
          prominent
        >Hello</v-alert>
      </v-container>
    </transition>
  </div>
</template>

<script>

export default {
  components: {
  },
  data() {
    return ({
      slide: 'slide-in',
      show: false,
    });
  },
};
</script>

<style scoped>
.slide-in-enter-active,
.slide-in-leave-active {
  transition: all 0.5s;
}

.slide-in-enter {
  transform: translateX(100vw);
}
.slide-in-leave-to {
  position: fixed;
  transform: translateX(-100vw);
}
.slide-in-leave {
  transform: translateX(0%);
}
.slide-in-enter-to {
  position: fixed;
  transform: translateX(0%);
}

.slide-out-enter-active,
.slide-out-leave-active {
  transition: all 0.5s;
}

.slide-out-enter {
  transform: translateX(-100vw);
}
.slide-out-leave-to {
  position: fixed;
  transform: translateX(100vw);
}
.slide-out-leave {
  transform: translateX(0%);
}
.slide-out-enter-to {
  position: fixed;
  transform: translateX(0%);
}
</style>
