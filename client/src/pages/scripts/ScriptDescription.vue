<template>
  <a-dialog
    v-if="state.entity"
    :modelValue="props.modelValue"
    @update:modelValue="closeDialog"
    @click:outside="closeDialog"
    :max-width="mobile ? '100%' : '75%'">
    <a-card color="background">
      <a-card-title class="mt-4 d-flex align-start justify-space-between" style="white-space: pre-wrap">
        <span class="d-flex align-start">
          <a-icon class="mr-2">mdi-open-in-new</a-icon>
          {{ state.entity.name }}
        </span>
        <span :class="{ mobileDisplay: smAndDown, desktopDisplay: !smAndDown }">
          <router-link
            :to="{ name: 'group-scripts-edit', params: { id: $route.params.id, scriptId: state.entity._id } }">
            <a-btn class="marginRight" color="primary"> <a-icon left>mdi-pencil</a-icon> Edit </a-btn>
          </router-link>
          <a-btn @click="closeDialog" variant="flat">
            <a-icon>mdi-close</a-icon>
          </a-btn>
        </span>
      </a-card-title>
      <a-card-subtitle>
        <div class="text-secondary">{{ state.entity._id }}</div>
      </a-card-subtitle>

      <code-editor title="" class="pt-4 code-editor" :readonly="true" :code="state.entity.content" />
    </a-card>
  </a-dialog>
</template>

<script setup>
import { reactive, watch } from 'vue';
import { useDisplay } from 'vuetify';

import api from '@/services/api.service';
import codeEditor from '@/components/ui/CodeEditor.vue';
// When lazy-loading, the code editor just keeps on growing and growing :/
// const codeEditor = defineAsyncComponent(() => import('@/components/ui/CodeEditor.vue'));

const { mobile, smAndDown } = useDisplay();

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

.mobileDisplay {
  display: flex;
  flex-direction: column-reverse;
  align-items: flex-end;
}
.mobileDisplay .marginRight {
  margin-top: 16px;
}
.desktopDisplay .marginRight {
  margin-right: 16px;
}
</style>
