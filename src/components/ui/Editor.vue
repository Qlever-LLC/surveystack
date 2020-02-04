<template>
  <div style="width: 100%; height: 100%; min-height: 100%;">
    <v-tabs
      v-model="selectedTab"
      dark
      background-color="dark-blue"
    >
      <v-tab @click="showCode" key="tab_code">Code</v-tab>
      <v-tab @click="showSurvey" key="tab_survey">Survey</v-tab>
    </v-tabs>
    <div
      style="height: 100%"
      id="monaco-editor"
    >
    </div>
  </div>

</template>
<script>

import * as monaco from 'monaco-editor';
// Add additonal d.ts files to the JavaScript language service and change.
// Also change the default compilation options.
// The sample below shows how a class Facts is declared and introduced
// to the system and how the compiler is told to use ES6 (target=2).

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
  '',
  'function relevant() {',
  '\treturn true;',
  '}',
].join('\n');


export default {
  data() {
    return {
      libraryState: null,
      codeState: null,
      editor: null,
      code: null,
      library: null,
      selectedTab: 'tab_survey',
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
          this.editor.dispose();
        }

        this.code = monaco.editor.createModel(jsCode, 'javascript');
        this.library = monaco.editor.createModel('', 'javascript');

        this.editor = monaco.editor.create(document.getElementById('monaco-editor'), {
          theme: 'vs-dark',
          language: 'javascript',
          model: this.code,
          automaticLayout: true,
        });

        this.library = monaco.editor.createModel(`const survey = ${JSON.stringify(newVal, null, 4)};`, 'javascript');
        this.code = monaco.editor.createModel(v, 'javascript');


        this.editor.setModel(libraryActive ? this.library : this.code);
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
