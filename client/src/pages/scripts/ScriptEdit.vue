<template>
  <a-container>
    <a-snackbar v-model="state.notification.isVisible" :color="state.notification.type">
      {{ state.notification.message }}
      <template v-slot:actions="{ props }">
        <a-btn color="white" variant="text" v-bind="props" @click="state.notification.isVisible = false">
          Dismiss
        </a-btn>
      </template>
    </a-snackbar>
    <a-card class="pa-8" color="background">
      <h1>{{ state.editMode ? 'Edit script' : 'Create script' }}</h1>
      <span class="text-secondary">{{ state.entity._id }}</span>
      <div v-if="state.errorLoadingScript" class="ma-10">
        <a-alert color="error">
          <v-icon class="mr-3">mdi-alert</v-icon>
          Error loading script, please check network connectivity and refresh.
        </a-alert>
      </div>
      <a-form ref="form" v-else>
        <a-text-field v-model="state.entity.name" label="Script name" name="script name" variant="outlined" :rules=scriptNameRules />

        <code-editor title="" class="code-editor mt-4" :code="state.entity && state.entity.content"
          @change="updateCode" />
        <div class="d-flex mt-5 justify-end">
          <a-btn variant="text" @click.prevent="cancel">Back</a-btn>
          <a-btn color="primary" type="submit" @click.prevent="submit">Save</a-btn>
        </div>
      </a-form>
    </a-card>
  </a-container>
</template>

<script setup>
import ObjectId from 'bson-objectid';
import api from '@/services/api.service';
import { SPEC_VERSION_SCRIPT, DEFAULT_SCRIPT } from '@/constants';
import codeEditor from '@/components/ui/CodeEditor.vue';
import { useGroup } from '@/components/groups/group';
import { reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ref } from 'vue';

const { getActiveGroup } = useGroup();
const router = useRouter();
const route = useRoute();
const now = new Date();

const form = ref(null);

const state = reactive({
  errorLoadingScript: false,
  group: null,
  editMode: !route.matched.some(({ name }) => name === 'group-scripts-new'),
  entity: {
    _id: '',
    name: '',
    meta: {
      dateCreated: now,
      dateModified: now,
      revision: 1,
      creator: null,
      group: {
        id: null,
        path: null,
      },
      specVersion: SPEC_VERSION_SCRIPT,
    },
    content: DEFAULT_SCRIPT,
  },
  notification: {
    message: '',
    type: null,
    isVisible: false,
  },
});

initData();

function setNotification(message, type = 'error', isVisible = true) {
  state.notification.message = message;
  state.notification.type = type;
  state.notification.isVisible = isVisible;
}

async function initData() {
  state.group = await getActiveGroup();
  state.entity._id = new ObjectId();

  if (state.editMode) {
    try {
      const { scriptId } = route.params;
      const { data } = await api.get(`/scripts/${scriptId}`);
      state.entity = { ...state.entity, ...data };
    } catch (e) {
      console.log('something went wrong:', e);
      setNotification(`Failed to load script. ${e}`);
      state.errorLoadingScript = true;
    }
  } else {
    state.entity.meta.group.id = state.group._id;
    state.entity.meta.group.path = state.group.path;
  }
}

function cancel() {
  router.push(`/groups/${state.group._id}/scripts`);
}

function updateCode(code) {
  state.entity.content = code;
}

const scriptNameRules = [
  value => !!value || 'Required',
  value => (value || '').length <= 35 || 'Maximum 35 characters',
  value => (value || '').length > 4 || 'Minimum 5 characters',
];

async function submit() {
  state.notification.message = '';
  state.notification.isVisible = false;
  state.notification.type = '';
  const { valid, errors } = await form.value.$refs.form.validate();
  if (!valid) {
    setNotification(`Please fix validation issue: ${errors[0].id}: ${errors[0].errorMessages[0].toLowerCase()}`);
    return;
  }

  try {
    if (state.editMode) {
      await api.put(`/scripts/${state.entity._id}`, state.entity);
    } else {
      await api.post('/scripts', state.entity);
      await router.push(`/groups/${route.params.id}/scripts`);
    }
    setNotification('Script saved', 'success');
  } catch (err) {
    console.log(err);
    setNotification(`Could not save script, please try again. ${err}`);
  }
}
</script>

<style scoped>
.code-editor {
  height: 68vh;
}
</style>
