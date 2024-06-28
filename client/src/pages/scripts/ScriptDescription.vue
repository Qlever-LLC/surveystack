<template>
  <app-dialog :modelValue="props.modelValue" @update:modelValue="closeDialog" @close="closeDialog">
    <template v-slot:title>
      <span class="d-flex align-start">
        {{ state.entity?.name || 'Script' }}
      </span>
    </template>

    <template v-slot:subtitle>
      <div class="text-secondary">{{ state.entity?._id }}</div>
    </template>

    <template v-slot:text>
      <v-skeleton-loader type="card-avatar, actions" v-if="state.scriptIsLoading" />
      <div v-else-if="state.entity">
        <code-editor title="" class="pt-4 code-editor" :readonly="true" :code="state.entity.content" />
      </div>
      <div v-else class="ma-10">
        <a-alert color="error">
          <v-icon class="mr-3">mdi-alert</v-icon>
          Error loading script, please check network connectivity and refresh.
        </a-alert>
      </div>
    </template>
  </app-dialog>
</template>

<script setup>
import { reactive, watch } from 'vue';

import api from '@/services/api.service';
import codeEditor from '@/components/ui/CodeEditor.vue';
// When lazy-loading, the code editor just keeps on growing and growing :/
// const codeEditor = defineAsyncComponent(() => import('@/components/ui/CodeEditor.vue'));

import appDialog from '@/components/ui/Dialog2.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  selectedScript: {
    type: null,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const state = reactive({
  entity: null,
  errorLoadingScript: false,
  scriptIsLoading: false,
});

function closeDialog() {
  emit('update:modelValue', false);
}

watch(
  () => props.modelValue,
  async (newVal) => {
    // if the dialog will be displayed
    if (newVal) {
      try {
        state.scriptIsLoading = true;
        const scriptId = props.selectedScript._id;
        const { data } = await api.get(`/scripts/${scriptId}`);
        state.entity = { ...state.entity, ...data };
      } catch (e) {
        console.log(e);
        state.errorLoadingScript = true;
      } finally {
        state.scriptIsLoading = false;
      }
    }
  }
);
</script>

<style scoped lang="scss">
.code-editor {
  height: 75vh;
  min-height: 300px;
}
</style>
