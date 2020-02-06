<template>
  <div class="full">
    <v-card
      dark
      color="dark-blue--lighten-2"
      class="card-height"
      slot="paneL"
    >
      <v-card-title>{{ title }} <v-chip
          v-if="result !== null"
          class="mx-4"
          :color="result ? 'green' : 'red'"
        >{{ result }}</v-chip>
        <v-spacer></v-spacer>
        <v-icon
          v-if="runnable"
          class="mr-4"
          @click="$emit('run', model.getValue())"
        >mdi-play</v-icon>
        <v-icon @click="$emit('close')">mdi-close-circle-outline</v-icon>
      </v-card-title>
      <div
        class="error red text--white pa-2"
        v-if="error"
      >{{ error }}</div>
      <div
        class="editor-height"
        :id="'monaco-editor-'+_uid"
      > </div>
    </v-card>
  </div>
</template>

<style scoped>
.error {
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe WPC", "Segoe UI",
    "HelveticaNeue-Light", "Ubuntu", "Droid Sans", sans-serif !important;
}

.full {
  width: 100%;
  height: 100%;
}

.editor-height {
  height: 100%;
}

.card-height {
  height: calc(100% - 56px);
}
</style>

<script>

import * as monaco from 'monaco-editor';

// validation settings
monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: true,
  noSyntaxValidation: false,
});

// compiler options
monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
  target: monaco.languages.typescript.ScriptTarget.ES6,
  allowNonTsExtensions: true,
});

monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);

monaco.editor.createModel(`
/**
 * logs a message
 */
function log(message){};
`, 'javascript');

export default {
  data() {
    return {
      editor: null,
      model: null,
      viewState: null,
    };
  },
  props: {
    error: {
      default: null,
    },
    title: {
      default: 'Code Editor',
    },
    code: {
      default: '',
    },
    readonly: {
      default: false,
    },
    refresh: Number,
    language: {
      default: 'javascript',
    },
    theme: {
      default: 'vs-dark',
    },
    runnable: {
      default: false,
    },
    result: {
      default: null,
    },
  },
  watch: {
    refresh() {
      if (this.editor === null || this.model === null) {
        return;
      }

      this.viewState = this.editor.getViewState();
      const v = this.model.getValue();

      this.model.dispose(); // this seems required to refresh intelisense

      const model = monaco.editor.createModel(v, this.language);

      this.editor.dispose();
      this.editor = monaco.editor.create(document.getElementById(`monaco-editor-${this._uid}`), {
        theme: this.theme,
        language: this.language,
        automaticLayout: true,
        readOnly: this.readonly,
        model: this.model,
      });
      this.editor.restoreViewState(this.viewState);

      this.model = model;
    },
    code(newVal) {
      if (this.editor === null || this.model === null) {
        return;
      }
      this.model.setValue(newVal);
    },
  },
  mounted() {
    this.model = monaco.editor.createModel(this.code, this.language);

    this.editor = monaco.editor.create(document.getElementById(`monaco-editor-${this._uid}`), {
      theme: this.theme,
      language: this.language,
      automaticLayout: true,
      readOnly: this.readonly,
      model: this.model,
    });
  },
};
</script>
