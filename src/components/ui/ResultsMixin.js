export default {
  data() {
    return {
      resultItems: [],
      showResult: false,
    };
  },
  methods: {
    result(response) {
      this.showResult = true;
      console.log('response', response);
      this.resultItems = [];
      let hasErrors = false;

      if (response.data.farmos) {
        response.data.farmos.forEach((farmos) => {
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
              body: farmos.uri,
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
