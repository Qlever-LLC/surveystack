<template>
  <survey-description v-model="state.showDescription" :selectedSurvey="state.selectedSurvey"> </survey-description>
  <a-dialog
    :modelValue="props.modelValue"
    @update:modelValue="emit('update:modelValue', $event)"
    width="500"
    max-width="75%">
    <a-card>
      <a-card-title>
        List library consumers {{ state.libraryConsumers !== null ? '(' + state.libraryConsumers.length + ')' : '' }}
      </a-card-title>
      <a-divider />
      <a-card-text>
        <a-list dense style="max-height: 500px" class="overflow-y-auto">
          <a-container v-if="state.libraryConsumers === null" class="d-flex align-center justify-center" cssHeight100>
            <a-progress-circular :size="50" />
          </a-container>
          <template v-if="state.libraryConsumers !== null">
            <a-list-item v-for="c in state.libraryConsumers" :key="c._id" @click="goToSurvey(c)">
              <small class="text-grey">{{ c._id }}</small>
              <a-list-item-title>{{ c.name }}</a-list-item-title>
            </a-list-item>
          </template>
        </a-list>
      </a-card-text>
      <a-divider />
      <a-card-actions>
        <a-spacer />
        <a-btn @click="emit('cancel')" color="primary" variant="text"> Close </a-btn>
      </a-card-actions>
    </a-card>
  </a-dialog>
</template>

<script setup>
import { reactive } from 'vue';
import api from '@/services/api.service';

import SurveyDescription from '@/pages/surveys/SurveyDescription.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  librarySurvey: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['cancel', 'update:modelValue']);

const state = reactive({
  libraryConsumers: null,
  showDescription: false,
  selectedSurvey: undefined,
});

loadLibraryConsumers();

async function loadLibraryConsumers() {
  const response = await api.get(`/surveys/list-library-consumers?id=${props.librarySurvey._id}`);
  state.libraryConsumers = response.data;
}
function goToSurvey(survey) {
  state.selectedSurvey = survey;
  state.showDescription = true;
}
</script>

<style scoped lang="scss">
.survey-group-name-input >>> .v-input__slot ::before {
  border: none;
}

.survey-group-name-input >>> .v-input__control >>> .v-input__slot ::before {
  border: none;
}
</style>
