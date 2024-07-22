<template>
  <div class="full">
    <a-card color="dark-blue-lighten-2" class="card-height">
      <a-card-title class="d-flex"
        >{{ title || '' }}

        <a-chip v-if="result !== null && typeof result === 'boolean'" class="mx-4" :color="result ? 'green' : 'red'">
          {{ result }}
        </a-chip>

        <a-chip
          v-if="result !== null && typeof result === 'object'"
          class="mx-4"
          color="blue"
          @click.stop="dialog = true">
          Result Object (click to expand)
        </a-chip>

        <a-dialog v-model="dialog" width="800">
          <a-card>
            <a-card-title class="headline">Object Created</a-card-title>
            <div style="width: 100%; height: 60vh">
              <code-view :modelValue="JSON.stringify(result, null, 2)" :read-only="readonly" />
            </div>

            <a-card-actions>
              <a-spacer />
              <a-btn color="green-darken-1" variant="text" @click="dialog = false"> Close </a-btn>
            </a-card-actions>
          </a-card>
        </a-dialog>

        <a-spacer />
        <a-btn variant="outlined" v-if="saveable" class="ml-auto mr-4" @click="$emit('save', code)">
          <a-icon left>mdi-content-save</a-icon> Save
        </a-btn>
        <a-btn class="mr-2" variant="outlined" v-if="examples" @click="$emit('examples')">
          <a-icon left>mdi-code-braces</a-icon>Examples
        </a-btn>
        <a-btn class="mr-2" variant="outlined" v-if="runnable" @click="$emit('run', code)">
          <a-icon left>mdi-play</a-icon> Run
        </a-btn>
        <a-btn variant="outlined" v-if="isClosable" @click="$emit('close')">
          <a-icon left>mdi-close</a-icon> Close
        </a-btn>
      </a-card-title>
      <div class="error text-red pa-2" v-if="error">{{ error }}</div>
      <code-view
        :modelValue="code"
        :read-only="readonly"
        @update:modelValue="$emit('change', $event)"
        class="editor-height" />
    </a-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import CodeView from '@/components/builder/CodeView.vue';

const props = defineProps({
  error: {
    type: undefined,
    default: null,
  },
  title: {
    type: String,
    default: null,
  },
  code: {
    type: String,
    default: '',
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  runnable: {
    default: false,
  },
  saveable: {
    default: false,
  },
  result: {
    default: null,
  },
  examples: {
    default: false,
  },
  isClosable: {
    default: false,
  },
});
const emit = defineEmits(['save', 'change', 'close', 'examples', 'run']);
const dialog = ref(false);
</script>

<style scoped lang="scss">
.error {
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe WPC', 'Segoe UI', 'HelveticaNeue-Light', 'Ubuntu', 'Droid Sans',
    sans-serif !important;
}

.full {
  width: 100%;
  height: 100%;
}

.editor-height {
  height: 100%;
}

.card-height {
  height: calc(100% - 56px);
}
</style>
