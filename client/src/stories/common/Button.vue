<template>
  <a-btn :class="classes" @click="onClick($event)" outlined>{{ label }}</a-btn>
</template>

<script>
import '../css/button.css';

export default {
  name: 'custom-button',

  props: {
    label: {
      type: String,
      required: true,
    },
    primaryGreen: { type: Boolean, default: false },
    secondaryGreen: { type: Boolean, default: false },
    skinny: { type: Boolean, default: false },
    little: { type: Boolean, default: false },
    noBorder: { type: Boolean, default: false },
    colorBlue: { type: Boolean, default: false },
    colorWhite: { type: Boolean, default: false },
    colorRed: { type: Boolean, default: false },
    bigFont: { type: Boolean, default: false },
  },
  emits: ['on-click'],
  setup(props, { emit }) {
    function onClick(event) {
      emit('onClick', event);
    }
    return {
      onClick,
    };
  },
  computed: {
    classes() {
      return {
        'button--base': true,
        'button--primaryGreen': this.primaryGreen,
        'button--secondaryGreen': this.secondaryGreen,
        'button--skinny': this.skinny,
        'button--little': this.little,
        'button--noBorder': this.noBorder,
        'button--colorBlue': this.colorBlue,
        'button--colorWhite': this.colorWhite,
        'button--colorRed': this.colorRed,
        'button--bigFont': this.bigFont,
      };
    },
  },

  /*methods: {
    onClick(event) {
      this.$emit('onClick', event);
      //console.log('click button', event);
    }
  }*/
};
</script>
