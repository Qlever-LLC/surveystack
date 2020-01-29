export default {

  props: {
    control: { type: Object, required: true },
    eval: { type: Function, required: true },
    changed: { type: Function, required: true },
    showNav: { type: Function, required: true },
    hideNav: { type: Function, required: true },
    next: { type: Function, required: true },
    hideNext: { type: Function, required: true },
    showNext: { type: Function, required: true },
  },
  computed: {
    value() {
      return this.control.value;
    },
  },
};
