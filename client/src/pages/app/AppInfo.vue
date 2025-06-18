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
          Commit Hash: <strong>{{ lcl.shortHash }}</strong>
        </p>
        <p>
          Release Date: <strong>{{ releaseDate }}</strong>
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
import { useDisplay } from 'vuetify';

const { mobile } = useDisplay();

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const lcl = JSON.parse(process.env.VUE_APP_LCL);

const releaseDate = lcl?.committer?.date ?
  new Date(lcl.committer.date * 1000).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }) :
  '';

function closeDialog() {
  emit('update:modelValue', false);
}
</script>
