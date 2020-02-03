export default {
  props: {
    control: { type: Object, required: true },
    value: { required: true },
    index: { required: true },
  },
  computed: {
    // value() {
    //   return this.control.value;
    // },
  },
  methods: {
    eval() {
      this.$emit('eval');
    },
    changed(value) {
      this.$emit('changed', value);
    },
    showNav() {
      this.$emit('show-nav');
    },
    hideNav() {
      this.$emit('hide-nav');
    },
    next() {
      this.$emit('next');
    },
    hideNext() {
      this.$emit('hide-next');
    },
    showNext() {
      this.$emit('show-next');
    },
  },
};
