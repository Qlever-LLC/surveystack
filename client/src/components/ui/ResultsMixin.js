import { parseSubmitResponse } from '@/utils/submissions';
import { get } from 'lodash';

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

      if (error) {
        this.resultItems.push({
          title: 'Error',
          body: get(error, 'response.data.message', error),
          logs: get(error, 'response.data.logs'),
          error: true,
        });

        return;
      }

      this.resultItems.push(...parseSubmitResponse(response));
    },
  },
};
