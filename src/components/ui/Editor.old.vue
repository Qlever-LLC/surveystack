<template>
  <div style="width: 100%; height: 80%;">
    <split-pane
      :min-percent='20'
      :default-percent='50'
      split="vertical"
    >
      <v-card
        dark
        style="height: calc(100% - 32px);"
        color="dark-blue--lighten-2"
        class="ma-4"
        slot="paneL"
      >
        <v-card-title>Code</v-card-title>
        <div
          style="height: calc(100% - 80px)"
          id="monaco-editor-main"
        > </div>
      </v-card>

      <v-card
        dark
        style="height: calc(100% - 32px);"
        color="dark-blue--lighten-2"
        class="ma-4"
        slot="paneR"
      >
        <v-card-title>Survey</v-card-title>

        <div
          style="height: calc(100% - 80px)"
          id="monaco-editor-survey"
        >
        </div>
      </v-card>
    </split-pane>

  </div>

</template>
<script>

import * as monaco from 'monaco-editor';
import splitPane from 'vue-multipane';

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

// extra libraries
const definitions = (survey) => {
  let declaration = 'declare class survey {\n';
  Object.keys(survey).forEach((k) => {
    declaration += `static ${k}:string;\n`;
    declaration += 'static personalData = class {\n';
    declaration += `static inner_${k}:string;\n`;
    declaration += '}\n';
  });
  declaration += '}\n';
  return declaration;
};

const jsCode = [
  `
 /**
 * return true if this question should be shown
 * and false if it should be skipped.
 * 
 * Skipping groups will skip all child questions
 * within the group.
 * 
 */
function relevant() {
\treturn true;
}
`,
].join('\n');


export default {
  components: {
    splitPane,
  },
  data() {
    return {
      libraryState: null,
      codeState: null,
      editor: null,
      code: null,
      library: null,
    };
  },
  props: [
    'survey',
  ],
  watch: {
    survey: {
      handler(newVal) {
        console.log(this.editor);
        const libraryActive = this.editor !== null ? (this.editor.getModel() === this.library) : true;

        let v = '';
        if (this.editor !== null) {
          v = this.code.getValue();

          this.library.dispose();
          this.code.dispose();
          // this.editor.dispose();
        } else {
          v = jsCode;
        }

        this.code = monaco.editor.createModel(v, 'javascript');
        this.library = monaco.editor.createModel(`const survey = ${JSON.stringify(newVal, null, 4)};`, 'javascript');

        if (this.editor === null) {
          this.editor = monaco.editor.create(document.getElementById('monaco-editor-main'), {
            theme: 'vs-dark',
            language: 'javascript',
            automaticLayout: true,
          });
          this.surveyEditor = monaco.editor.create(document.getElementById('monaco-editor-survey'), {
            theme: 'vs-dark',
            language: 'javascript',
            automaticLayout: true,
          });
        }


        this.editor.setModel(this.code);
        this.surveyEditor.setModel(this.library);


        if (!libraryActive) {
          this.editor.restoreViewState(this.codeState);
        }
      },
      deep: true,
    },

  },
  methods: {
    showSurvey() {
      if (this.editor.getModel() === this.library) {
        return;
      }

      this.editor.updateOptions({ readOnly: false });
      this.codeState = this.editor.saveViewState();

      this.editor.setModel(this.library);
      this.editor.restoreViewState(this.libraryState);
      this.editor.focus();
    },
    showCode() {
      if (this.editor.getModel() === this.code) {
        return;
      }

      this.editor.updateOptions({ readOnly: false });
      this.libraryState = this.editor.saveViewState();

      this.editor.setModel(this.code);
      this.editor.restoreViewState(this.codeState);
      this.editor.focus();
    },
  },
};
</script>
