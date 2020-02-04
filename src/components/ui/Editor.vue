<template>
  <div id="monaco-editor">
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
  '        return true;',
  '}',
].join('\n');


export default {
  data() {
    return {
      editor: null,
    };
  },
  props: [
    'survey',
  ],
  watch: {
    survey: {
      handler(newVal, oldVal) {
        console.log(this.editor);
        monaco.languages.typescript.javascriptDefaults.setExtraLibs({
          libs: [[
            definitions(newVal),
          ].join('\n'), 'ts:filename/survey.d.ts'],
        });

        const template = `const structure = ${JSON.stringify(newVal, null, 4)}\n ${jsCode}`;

        this.editor.setValue(template);
      },
      deep: true,
    },

  },
  mounted() {
    this.editor = monaco.editor.create(document.getElementById('monaco-editor'), {
      theme: 'vs-dark',
      language: 'javascript',
    });
  },
};
</script>
