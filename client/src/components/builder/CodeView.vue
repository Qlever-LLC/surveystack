<template>
  <vue-monaco-editor
    :value="modelValue"
    :options="editorOptions"
    language="javascript"
    @change="emit('update:modelValue', $event)"
    @mount="handleMount"
    >Loading code editor...</vue-monaco-editor
  >
</template>

<script setup>
import { VueMonacoEditor } from '@guolao/vue-monaco-editor';
import { shallowRef, computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  readOnly: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const editorOptions = computed(() => {
  return {
    automaticLayout: true,
    formatOnType: true,
    formatOnPaste: true,
    readOnly: props.readOnly,
    minimap: { enabled: false },
    readOnlyMessage: {
      value: 'You don\'t have editing rights for this script. Please either go to the Group which owns this script and edit it there, ask the script authors to edit it for you, or copy the code and make your own version of the script in your group.'
    },
  };
});


const editorRef = shallowRef();
const handleMount = (editor) => (editorRef.value = editor);
</script>
