import { get } from 'lodash';
import { isOnline } from '@/utils/surveyStack';
import { ref } from 'vue';

export function useResults() {
  const showResult = ref(false);
  const resultItems = ref([]);

  function result({ response, error }) {
    showResult.value = true;
    resultItems.value = [];
    let hasErrors = false;

    if (error) {
      hasErrors = true;
      if (isOnline()) {
        resultItems.value.push({
          title: 'Error',
          body: (error.response && error.response.data && error.response.data.message) || error,
          logs: error.response && error.response.data && error.response.data.logs,
          error: true,
        });
      } else {
        resultItems.value.push({
          title: 'Offline',
          body: 'Cannot submit without internet connection. This submission will be submitted automatically next time you open the app while online.',
          error: true,
        });
      }
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
            resultItems.value.push({
              title: 'Error submitting to FarmOS',
              body: `${farmos.error.output.payload.error}: ${farmos.error.output.payload.message}`,
              error: true,
            });
          } else {
            resultItems.value.push({
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
      resultItems.value.push({
        title: 'Success',
        body: 'Successful submission',
        response,
        logs: [...getLogsOf('farmos'), ...getLogsOf('hylo')],
      });
    }
  }

  return {
    showResult,
    resultItems,
    result,
  };
}
