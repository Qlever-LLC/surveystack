<template>
  <a-dialog
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    width="700"
    max-width="75%">
    <a-card>
      <a-card-title> Add Survey To Library </a-card-title>
      <a-card-text>
        <a-text-field :modelValue="localLibrarySurvey.name" label="Title" readonly />
        <h3>Description</h3>
        <tip-tap-editor v-model="localLibrarySurvey.meta.libraryDescription" class="mb-4" />
        <h3>Applications</h3>
        <tip-tap-editor v-model="localLibrarySurvey.meta.libraryApplications" class="mb-4" />
        <h3>Maintainers</h3>
        <tip-tap-editor v-model="localLibrarySurvey.meta.libraryMaintainers" class="mb-4" />
        <h3>Version history</h3>
        <tip-tap-editor v-model="localLibrarySurvey.meta.libraryHistory" class="mb-4" />
        <library-change-type-selector
          v-if="localLibrarySurvey.meta.isLibrary"
          v-model="localLibrarySurvey.meta.libraryLastChangeType"
          :disabled="false"
          label="Latest change type" />
      </a-card-text>
      <a-card-actions class="mr-3">
        <a-spacer />
        <a-btn @click="$emit('ok', localLibrarySurvey)" color="primary" variant="text">
          <span v-if="!librarySurvey.meta.isLibrary">Add to library</span>
          <span v-if="localLibrarySurvey.meta.isLibrary">Save</span>
        </a-btn>
        <a-btn @click="$emit('cancel')" color="primary" variant="text"> Cancel </a-btn>
      </a-card-actions>
    </a-card>
  </a-dialog>
</template>
<script>
import LibraryChangeTypeSelector from '@/components/survey/library/LibraryChangeTypeSelector';
import TipTapEditor from '@/components/builder/TipTapEditor.vue';
import { ref } from 'vue';

export default {
  name: 'edit-library-dialog',
  components: { LibraryChangeTypeSelector, TipTapEditor },
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    librarySurvey: {
      type: Object,
      required: true,
    },
  },
  emits: ['ok', 'cancel', 'update:modelValue'],
  setup(props) {
    const localLibrarySurvey = ref(props.librarySurvey);

    localLibrarySurvey.value.meta.libraryDescription = localLibrarySurvey.value.meta.libraryDescription || '';
    localLibrarySurvey.value.meta.libraryApplications = localLibrarySurvey.value.meta.libraryApplications || '';
    localLibrarySurvey.value.meta.libraryMaintainers = localLibrarySurvey.value.meta.libraryMaintainers || '';
    localLibrarySurvey.value.meta.libraryHistory = localLibrarySurvey.value.meta.libraryHistory || '';
    localLibrarySurvey.value.meta.libraryLastChangeType = localLibrarySurvey.value.meta.libraryLastChangeType || '';

    return {
      localLibrarySurvey,
    };
  },
};
</script>
<style scoped lang="scss">
.survey-group-name-input >>> .v-input__slot ::before {
  border: none;
}

.survey-group-name-input >>> .v-input__control >>> .v-input__slot ::before {
  border: none;
}
</style>
