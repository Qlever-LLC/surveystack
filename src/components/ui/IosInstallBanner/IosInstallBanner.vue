<template>
  <div>
    <v-snackbar
      :value="value"
      @input="handleInput"
      :timeout="0"
      color="blue"
      fixed
      bottom
      class="snackbar"
    >
      <v-btn
        @click="handleClose"
        icon
        class="close-button"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
      <div class="text-center">
        <h2>Install</h2>
        <div class="d-flex align-center justify-center">
            Just tap
            <img src="./ios-safari-center-icon.svg" alt="" class="icon"/>
            then
            Add To Homescreen
            <img src="./ios-safari-add-icon.svg" alt="" class="icon" />
        </div>
      </div>
    </v-snackbar>
  </div>
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
  /* position: relative; */
}

.close-button {
  position: absolute;
  right: 10px;
  top: 3px;
}
</style>
