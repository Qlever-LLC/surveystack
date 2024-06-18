<template>
  <a-dialog
    :modelValue="props.modelValue"
    @update:modelValue="closeDialog"
    @click:outside="closeDialog"
    :max-width="mobile ? '100%' : '75%'"
    scrollable>
    <a-card class="py-4">
      <a-card-title class="d-flex align-start justify-space-between" style="white-space: pre-wrap">
        <span>Welcome to SurveyStack</span>
        <a-btn @click="closeDialog" variant="flat"><a-icon>mdi-close</a-icon></a-btn>
      </a-card-title>
      <a-card-text>
        <p>
          Current commit: <strong>{{ state.lcl.shortHash }}</strong>
        </p>

        SurveyStack is an open source project by
        <a href="https://our-sci.net" target="_blank">Our Sci</a>.
        <br />
        To view the source code visit our
        <a href="https://gitlab.com/our-sci/software/surveystack" target="_blank">Gitlab repository</a>
      </a-card-text>
    </a-card>
  </a-dialog>
</template>

<script setup>
import { reactive } from 'vue';
import { useDisplay } from 'vuetify';

const { mobile } = useDisplay();

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const state = reactive({
  lcl: JSON.parse(process.env.VUE_APP_LCL),
});

function closeDialog() {
  emit('update:modelValue', false);
}
</script>
