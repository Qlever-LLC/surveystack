# How to add a new Question Type

1. Add new .vue to `components/survey/question_types`
2. In `utils/surveyConfig.js` add a new Item
    ```
    {
        name: 'location', label: 'Pick Location',
        type: 'inputLocation',
    },
    ```