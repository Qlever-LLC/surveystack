export const QuestionComponentProps = {
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
};

export const QuestionComponentEmits = [
  'update:modelValue',
  'next',
  'initialize',
];

export function useQuestionComponent(emit) {
  function submit() {
    this.changed(this.modelValue);
    this.next();
  }
  function changed(value) {
    emit('update:modelValue', value);
  }
  function next() {
    emit('next');
  }
  function initialize() {
    emit('initialize');
  }

  return { submit, changed, next, initialize };
}
