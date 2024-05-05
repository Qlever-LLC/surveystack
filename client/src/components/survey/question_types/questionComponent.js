import { computed } from 'vue';

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
  'show-nav',
  'hide-nav',
  'next',
  'hide-next',
  'show-next',
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
  function showNav() {
    emit('show-nav');
  }
  function hideNav() {
    emit('hide-nav');
  }
  function next() {
    emit('next');
  }
  function hideNext() {
    emit('hide-next');
  }
  function showNext() {
    emit('show-next');
  }
  function initialize() {
    emit('initialize');
  }

  const dialogProps = computed(() => {
    const dom = document.querySelector('#previewSurvey');
    return {
      attach: dom ? '#previewSurvey' : undefined,
      hideOverlay: !!dom,
    };
  });

  return { submit, changed, showNav, hideNav, next, hideNext, showNext, initialize };
}
