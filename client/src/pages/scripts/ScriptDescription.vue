<template>
  <app-dialog v-if="state.entity" :modelValue="props.modelValue" @update:modelValue="closeDialog" @close="closeDialog">
    <template v-slot:title>
      <span class="d-flex align-start">
        <a-icon class="mr-2">mdi-open-in-new</a-icon>
        {{ state.entity.name }}
      </span>
    </template>

    <template v-slot:subtitle>
      <div class="text-secondary">{{ state.entity._id }}</div>
    </template>

    <template v-slot:text>
      <code-editor title="" class="pt-4 code-editor" :readonly="true" :code="state.entity.content" />
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
    type: undefined,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const state = reactive({
  entity: undefined,
});

function closeDialog() {
  emit('update:modelValue', false);
}

watch(
  () => props.modelValue,
  async (newVal) => {
    // if the dialog will be displayed
    if (newVal) {
      const scriptId = props.selectedScript._id;
      const { data } = await api.get(`/scripts/${scriptId}`);
      state.entity = { ...state.entity, ...data };
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
