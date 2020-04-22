export default {
  data() {
    return {
      resultItems: [],
      showResult: false,
    };
  },
  methods: {
    result({ response, error }) {
      this.showResult = true;
      this.resultItems = [];
      let hasErrors = false;

      if (error) {
        hasErrors = true;
        this.resultItems.push({
          title: 'Error',
          body: error.response.data.message,
          error: true,
        });
        return;
      }

      if (response.data.farmos) {
        response.data.farmos.forEach((farmos) => {
          if (!farmos) {
            return;
          }

          if (farmos.status === 'error') {
            this.resultItems.push({
              title: 'Error submitting to FarmOS',
              body: `${farmos.error.message}: ${farmos.error.config.data}`,
              error: true,
            });
            hasErrors = true;
          } else {
            this.resultItems.push({
              title: 'FarmOS success:',
              body: farmos.uri || farmos.message,
            });
          }
        });
      }

      if (!hasErrors) {
        this.resultItems.push({
          title: 'Success',
          body: 'Sucessful submission',
        });
      }
    },
  },
};
