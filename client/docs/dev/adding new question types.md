# How to add a new Question Type

1. Add new .vue to `components/survey/question_types`
   1. Optional, add new Editor Props in `comonents/builder/ControlProperties.vue`.
2. Reexport the component in `components/survey/question_types/index.js`
3. In `utils/surveyConfig.js` add a new Item
    ```
    {
        name: 'location', label: 'Pick Location',
        type: 'inputLocation',
    },
    ```
4. For Matrix Support, edit `MatrixCell.vue` and add a new Section mirroring control behaviour.
5. Add new Option to `MatrixEditor.vue`