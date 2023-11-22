<template>
  <div class="full">
    <v-card dark color="dark-blue--lighten-2" class="card-height" slot="paneL">
      <v-card-title
        >{{ title || '' }}

        <a-chip v-if="result !== null && typeof result === 'boolean'" class="mx-4" :color="result ? 'green' : 'red'">
          {{ result }}
        </a-chip>

        <a-chip
          v-if="result !== null && typeof result === 'object'"
          class="mx-4"
          color="blue"
          @click.stop="dialog = true"
        >
          Result Object (click to expand)
        </a-chip>

        <v-dialog v-model="dialog" width="800">
          <v-card>
            <v-card-title class="headline">Object Created</v-card-title>
            <div style="width: 100%; height: 60vh">
              <app-code-view :value="result"> </app-code-view>
            </div>

            <v-card-actions>
              <a-spacer />
              <v-btn color="green darken-1" text @click="dialog = false"> Close </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <a-spacer />
        <a-icon v-if="saveable" class="mr-4" @click="$emit('save', model.getValue())">mdi-content-save</a-icon>
        <v-btn class="mr-2" outlined color="white" v-if="examples" @click="$emit('examples')">
          <a-icon left>mdi-code-braces</a-icon>Examples
        </v-btn>
        <v-btn class="mr-2" outlined color="white" v-if="runnable" @click="$emit('run', model.getValue())">
          <a-icon left>mdi-play</a-icon> Run
        </v-btn>
        <a-icon @click="$emit('close')">mdi-close-circle-outline</a-icon>
      </v-card-title>
      <div class="error red text--white pa-2" v-if="error">{{ error }}</div>
      <div class="editor-height" :id="'monaco-editor-' + _uid"></div>
    </v-card>
  </div>
</template>

<style scoped>
.error {
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe WPC', 'Segoe UI', 'HelveticaNeue-Light', 'Ubuntu', 'Droid Sans',
    sans-serif !important;
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
import appCodeView from '@/components/builder/CodeView.vue';

/*
// TODO: make sure scripts editor still works
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
*/

monaco.editor.createModel(
  `
/**
 * logs a message
 */
function log(message){};
`,
  'javascript'
);

export default {
  components: {
    appCodeView,
  },
  data() {
    return {
      editor: null,
      model: null,
      viewState: null,
      dialog: false,
      resultEditor: null,
      resultModel: null,
    };
  },
  props: {
    error: {
      default: null,
    },
    title: {
      default: null,
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
    saveable: {
      default: false,
    },
    result: {
      default: null,
    },
    fold: {
      default: false,
    },
    examples: {
      default: false,
    },
  },
  model: {
    event: 'change',
    prop: 'code',
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

      this.editor.onDidChangeModelContent((event) => {
        const value = this.editor.getValue();
        if (this.value !== value) {
          if (!this.readonly) {
            this.$emit('change', value, event);
          }
        }
      });

      this.editor.restoreViewState(this.viewState);
      if (this.fold) {
        this.editor.trigger('fold', 'editor.foldAll');
      }

      this.model = model;
    },
    code(newVal) {
      if (this.editor) {
        if (newVal !== this.editor.getValue()) {
          this.editor.setValue(newVal);
        }
      }

      // this.model.setValue(newVal);
    },
    result() {
      // TODO show editor for result
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

    if (this.fold) {
      this.editor.trigger('fold', 'editor.foldAll');
    }

    this.editor.onDidChangeModelContent((event) => {
      const value = this.editor.getValue();
      if (this.value !== value) {
        if (!this.readonly) {
          this.$emit('change', value, event);
        }
      }
    });
  },
};
</script>
