<template>
  <a-card class="image-resource-editor p-relative">
    <a-card-title class="d-flex">
      <div>Image Resource Editor</div>
      <a-spacer />

      <a-btn icon @click="closeDialog">
        <a-icon>mdi-close</a-icon>
      </a-btn>
    </a-card-title>
    <a-card-text>
      <a-form
        v-if="
          resource &&
          (resource.label || resource.label === '') &&
          (resource.name || resource.name === '') &&
          (resource.content || resource.content === '')
        "
        ref="form">
        <a-text-field
          :modelValue="resource.label"
          @update:modelValue="handleUpdateLabel"
          label="Image Label"
          :rules="[nameHasValidLength]"
          persistent-hint
          variant="outlined" />
        <a-text-field
          :modelValue="resource.name"
          @update:modelValue="handleUpdateName"
          label="Image Data Name"
          persistent-hint
          variant="outlined"
          :rules="[nameIsUnique(resourceNames, props.resource), nameHasValidCharacters, nameHasValidLength]" />
        <a-text-field
          :modelValue="resource.content"
          @update:modelValue="handleUpdateContent"
          label="Image URL"
          persistent-hint
          variant="outlined" />
      </a-form>
    </a-card-text>
    <a-card-actions class="d-flex justify-space-between px-6 pb-4">
      <a-btn @click="deleteResource" color="error" variant="text" tabindex="-1"> Delete </a-btn>
      <a-btn @click="updateResource" variant="text" color="primary"> Update </a-btn>
    </a-card-actions>
  </a-card>
</template>

<script setup>
import { nameHasValidCharacters, nameHasValidLength, nameIsUnique } from '@/utils/resources';
import { ref, computed } from 'vue';

const props = defineProps({
  resources: {
    type: Array,
  },
  resource: {
    type: Object,
  },
});

const emit = defineEmits(['delete', 'close-dialog', 'change']);

const resourceNames = computed(() => {
  return props.resources.map(({ name, id }) => ({ name, id }));
});

const form = ref(null);

async function validate() {
  return await form.value.validate();
}
function deleteResource() {
  closeDialog();
  if (props.resource.id) {
    emit('delete', props.resource.id);
  }
}
async function updateResource() {
  if (await validate()) {
    emit('close-dialog');
  }
}
async function closeDialog() {
  if (!props.resource || (await validate())) {
    emit('close-dialog');
  }
}
// TODO: refactor to use internal data for resource, then only update resource on survey when button is clicked
function handleUpdateLabel(label) {
  emit('change', {
    ...props.resource,
    label,
  });
}
function handleUpdateName(name) {
  emit('change', {
    ...props.resource,
    name,
  });
}
function handleUpdateContent(content) {
  emit('change', {
    ...props.resource,
    content,
  });
}
</script>
