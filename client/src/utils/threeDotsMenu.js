import { ref, reactive } from 'vue';

export function menuAction() {
  const timeoutID = ref(false);
  const message = reactive({
    successMessage: null,
    errorMessage: null,
  });

  function success(msg) {
    if (timeoutID.value) {
      clearTimeout(timeoutID.value);
    }
    window.scrollTo(0, 0);
    setTimeout(() => {
      message.successMessage = null;
      timeoutID.value = null;
    }, 15000);
    message.successMessage = msg;
    message.errorMessage = null;
  }

  function error(msg) {
    if (timeoutID.value) {
      clearTimeout(timeoutID.value);
    }
    message.errorMessage = msg;
    message.successMessage = null;
    window.scrollTo(0, 0);
    timeoutID.value = setTimeout(() => {
      message.errorMessage = null;
      timeoutID.value = null;
    }, 15000);
  }

  /**
   * @param {id, e.g. of a survey or submission} dataObject
   * @param {see permission.js} right
   * @param {either a String or () => function} action
   * @returns
   */
  function createAction(dataObject, right, action) {
    const { allowed, message } = right(dataObject);
    if (allowed) {
      return action;
    } else {
      return () => error(message);
    }
  }

  return { success, error, message, createAction };
}

/*
 <a-alert
  v-if="message.successMessage"
  style="cursor: pointer"
  type="success"
  closable
  @click:close="message.successMessage = null">
  {{ message.successMessage }}
</a-alert>
<a-alert
  v-if="message.errorMessage"
  style="cursor: pointer"
  type="error"
  closable
  @click:close="message.errorMessage = null">
  {{ message.errorMessage }}
</a-alert>

import { menuAction } from '@/utils/threeDotsMenu';
const { success, error, message, createAction } = menuAction();
 */
