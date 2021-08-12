<template>
  <div class="code-editor pa-0" :id="'monaco-editor-' + _uid"></div>
</template>
<script>
import * as monaco from 'monaco-editor';

export default {
  props: {
    value: {
      required: true,
    },
    raw: {
      required: false,
      default: false,
    },
  },
  data() {
    return {
      editor: null,
    };
  },
  computed: {
    valueString() {
      return JSON.stringify(this.value, null, 2);
    },
  },
  methods: {
    writeBack(value) {
      try {
        const obj = JSON.parse(value);
        if (JSON.stringify(this.value) !== JSON.stringify(obj)) {
          this.$emit('input', obj);
        }
      } catch (error) {
        console.log('parsing failed', error);
      }
    },
    refresh() {
      console.log('value cahnged');
      const text = this.raw ? this.value : JSON.stringify(this.value, null, 2);
      const model = monaco.editor.createModel(text, 'javascript');
      console.log('models', monaco.editor.getModels());

      if (this.editor !== null) {
        this.editor.getModel().dispose();
        this.editor.dispose();
      }

      this.editor = monaco.editor.create(document.getElementById(`monaco-editor-${this._uid}`), {
        language: 'javascript',
        automaticLayout: true,
        readOnly: true,
        model,
      });
    },
  },
  watch: {
    value() {
      this.refresh();
    },
  },
  mounted() {
    this.refresh();
  },
};
</script>
<style scoped>
.code-editor {
  height: 100%;
}
</style>
