import { QuestionComponentProps } from './questionComponent'

export default {
  props: QuestionComponentProps,
  methods: {
    submit() {
      this.changed(this.modelValue);
      this.next();
    },
    changed(value) {
      this.$emit('update:modelValue', value);
    },
    next() {
      this.$emit('next');
    },
    initialize() {
      this.$emit('initialize');
    },
  }
};
