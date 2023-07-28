import { parseSubmitResponse } from '@/utils/submissions';
import { get } from 'lodash';
import { isOnline } from '@/utils/surveyStack';

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
        if (isOnline()) {
          this.resultItems.push({
            title: 'Error',
            body: get(error, 'response.data.message', error),
            logs: get(error, 'response.data.logs'),
            error: true,
          });
        } else {
          this.resultItems.push({
            title: 'Offline',
            body: 'Cannot submit without internet connection. Go to MY SUBMISSIONS and then DRAFTS to submit completed surveys when you have an internet connection',
            error: true,
          });
        }
      }

      this.resultItems.push(...parseSubmitResponse(response));
    },
  },
};
