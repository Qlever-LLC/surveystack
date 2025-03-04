export default {
  props: {
    control: { type: Object, required: true },
    modelValue: { required: true },
    meta: { type: Object, required: false },
    index: { required: true },
    autoFocus: { type: Boolean, default: true },
    relevant: { type: Boolean, default: true },
    required: { type: Boolean, default: false },
    redacted: { type: Boolean, default: false },
    forceMobile: { type: Boolean, default: false },
    isInBuilder: { type: Boolean, default: false },
    resources: {
      default: () => [],
    },
  },
  methods: {
    submit() {
      this.changed(this.modelValue);
      this.next();
    },
    eval() {
      this.$emit('eval');
    },
    changed(value) {
      this.$emit('update:modelValue', value);
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
    initialize() {
      this.$emit('initialize');
    },
  },
  computed: {
    dialogProps() {
      const dom = document.querySelector('#previewSurvey');
      return {
        attach: dom ? '#previewSurvey' : undefined,
        hideOverlay: !!dom,
      };
    },
  },
};
