import { get } from 'lodash';
import { nextTick } from 'vue';

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

      // debugger;
      if (error) {
        hasErrors = true;
        this.resultItems.push({
          title: 'Error',
          body: (error.response && error.response.data && error.response.data.message) || error,
          logs: error.response && error.response.data && error.response.data.logs,
          error: true,
        });
        return;
      }

      if (response.data.farmos) {
        response.data.farmos.forEach((farmos) => {
          if (!farmos) {
            return;
          }

          console.log('parsing error', farmos);

          if (farmos.status === 'error') {
            if (farmos.error.isBoom === true) {
              this.resultItems.push({
                title: 'Error submitting to FarmOS',
                body: `${farmos.error.output.payload.error}: ${farmos.error.output.payload.message}`,
                error: true,
              });
            } else {
              this.resultItems.push({
                title: 'Error submitting to FarmOS',
                body: `${farmos.error.message}: ${farmos.error.config.data}`,
                error: true,
              });
            }

            hasErrors = true;
          }
        });
      }

      const getLogsOf = (key) =>
        get(response, `data.${key}`, [])
          .map((h) => h.logs || [])
          .flat();

      if (!hasErrors) {
        this.resultItems.push({
          title: 'Success',
          body: 'Successful submission',
          response,
          logs: [...getLogsOf('farmos'), ...getLogsOf('hylo')],
        });
      }
    },
  },
};
