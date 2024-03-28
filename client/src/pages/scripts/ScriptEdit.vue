<template>
  <a-container>
    <a-card class="pa-8" color="background">
      <h1>{{ state.editMode ? 'Edit script' : 'Create script' }}</h1>
      <span class="text-secondary">{{ state.entity._id }}</span>
      <a-text-field v-model="state.entity.name" label="Script name" variant="outlined" hide-details />
      <code-editor
        title=""
        class="code-editor mt-4"
        :code="state.entity && state.entity.content"
        @change="updateCode" />
      <div class="d-flex mt-5 justify-end">
        <a-btn variant="text" @click="cancel">Cancel</a-btn>
        <a-btn color="primary" @click="submit">Save</a-btn>
      </div>
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

const { getActiveGroup } = useGroup();
const router = useRouter();
const route = useRoute();
const now = new Date();

const state = reactive({
  group: getActiveGroup(),
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
});

initData();

async function initData() {
  state.entity._id = new ObjectId();

  if (state.editMode) {
    try {
      const { scriptId } = route.params;
      const { data } = await api.get(`/scripts/${scriptId}`);
      state.entity = { ...state.entity, ...data };
    } catch (e) {
      console.log('something went wrong:', e);
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

async function submit() {
  if (state.entity.name.trim() === '') {
    console.log('Name must not be empty');
    return;
  }

  try {
    if (state.editMode) {
      await api.put(`/scripts/${state.entity._id}`, state.entity);
    } else {
      await api.post('/scripts', state.entity);
      await router.push(`/groups/${route.params.id}/scripts`);
    }
  } catch (err) {
    console.log(err);
  }
}
</script>

<style scoped lang="scss">
.code-editor {
  height: 75vh;
}
</style>
