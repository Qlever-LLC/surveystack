const survey2 = {
  _id: "calculating-survey-2019",
  controls: [
    {
      name: "first_name",
      label: "First name",
      type: "inputText",
      options: {
        readOnly: false,
        required: false,
        relevance: "",
        constraint: "",
        calculate: ""
      }
    },
    {
      name: "last_name",
      label: "Last name",
      type: "inputText",
      options: {
        readOnly: false,
        required: false,
        relevance: "",
        constraint: "",
        calculate: ""
      }
    },
    {
      name: "full_name",
      label: "Full name calculation",
      type: "inputText",
      options: {
        readOnly: false,
        required: false,
        relevance: "",
        constraint: "",
        calculate: "data.first_name + ' ' + data.last_name"
      }
    }
  ],
  name: "Calculating Survey 2019",
  __v: 0
};
