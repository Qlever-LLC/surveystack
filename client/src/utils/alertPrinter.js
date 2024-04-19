import { ref, reactive } from 'vue';

export function printAlert() {
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

  return { success, error, message };
}

/*
<a-alert
    v-if="message.successMessage"
    style="cursor: pointer"
    mode="fade"
    variant="text"
    type="success"
    @click="message.successMessage = null">
    {{ message.successMessage }}
</a-alert>
<a-alert
    v-if="message.errorMessage"
    style="cursor: pointer"
    mode="fade"
    variant="text"
    type="error"
    @click="message.errorMessage = null">
    {{ message.errorMessage }}
</a-alert>

import { printAlert } from '@/utils/feedbackPrinter';
const { success, error, message } = printAlert();
 */
