<template>
  <vue-monaco-editor
    :value="modelValue"
    theme="vs-dark"
    :options="MONACO_EDITOR_OPTIONS"
    language="javascript"
    @change="emit('update:modelValue', $event)"
    @mount="handleMount" />
</template>

<script setup>
import { VueMonacoEditor } from '@guolao/vue-monaco-editor';
import { shallowRef } from 'vue';

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

const MONACO_EDITOR_OPTIONS = {
  automaticLayout: true,
  formatOnType: true,
  formatOnPaste: true,
  readOnly: props.readOnly,
};

const editorRef = shallowRef();
const handleMount = (editor) => (editorRef.value = editor);
</script>
