<template>
  <a-card class="pb-2">
    <a-card-title class="d-flex pa-4">
      Documentation Links
      <a-spacer />
      <a-btn color="primary" variant="text" @click="state.showAddDialog = true">New.. </a-btn>
    </a-card-title>
    <a-card-subtitle>Custom links which appear in the side menu when logged into your group</a-card-subtitle>
    <VueDraggable
      v-if="props.group.docs && props.group.docs.length !== 0"
      class="draggable list-group"
      tag="div"
      :list="props.group.docs"
      :group="{ name: 'g1' }"
      :invertSwap="true"
      :dragOptions="{ animation: 200 }"
      @start="state.drag = true"
      @end="state.drag = false">
      <a-card
        v-for="(el, idx) in props.group.docs"
        :key="el.link + idx"
        class="ma-2 mx-6"
        elevation="1"
        variant="outlined">
        <a-card-text>
          <div class="d-flex justify-space-between align-center">
            <div>
              <span class="title">{{ el.label }}</span>
              <br />
              <a :href="el.link" target="_blank">{{ el.link }}</a>
            </div>
            <div class="d-flex">
              <a-btn icon @click.stop="() => showDeleteModal(idx)">
                <a-icon color="grey-lighten-1">mdi-delete</a-icon>
              </a-btn>
            </div>
          </div>
        </a-card-text>
      </a-card>
    </VueDraggable>
    <a-card class="ma-2" variant="outlined" elevation="1" v-else>
      <a-card-text>
        <span class="title text-secondary">No documentation links yet</span><br />
        <span class="font-weight-light text-grey-darken-2"
          >You can add documentation links from the menu in the top right</span
        >
      </a-card-text>
    </a-card>
    <a-dialog v-model="state.deleteModalIsVisible" max-width="290">
      <a-card>
        <a-card-title> Remove Documentation </a-card-title>
        <a-card-text class="mt-4">
          <a-checkbox
            v-model="state.removeFromDescendants"
            label="Also remove this documentation link from all descendant groups"
            hide-details />
        </a-card-text>
        <a-card-text class="mt-4"> Are you sure you want to remove this documentation link? </a-card-text>
        <a-card-actions>
          <a-spacer />
          <a-btn variant="text" @click.stop="cancelDeleteEntry"> Cancel </a-btn>
          <a-btn variant="text" color="red" @click.stop="handleConfirmDelete"> Remove </a-btn>
        </a-card-actions>
      </a-card>
    </a-dialog>

    <a-dialog v-model="state.showAddDialog" max-width="500">
      <a-card>
        <a-card-title>Add documentation link</a-card-title>
        <a-card-text>
          <a-form v-model="state.newIsValid" ref="form">
            <a-text-field
              class="mt-3"
              v-model="state.newDoc.label"
              label="Label"
              variant="outlined"
              required
              :rules="state.labelRules" />

            <a-text-field
              class="mt-3"
              v-model="state.newDoc.link"
              label="Link"
              variant="outlined"
              required
              :rules="state.linkRules" />

            <a-checkbox
              v-model="state.addToDescendants"
              label="Also add this documentation link to all descendant groups"
              hide-details />
          </a-form>
        </a-card-text>
        <a-card-actions>
          <a-spacer />
          <a-btn variant="text" @click.stop="cancelAddEntry"> Cancel </a-btn>
          <a-btn variant="text" color="primary" @click.stop="addEntry"> Submit </a-btn>
        </a-card-actions>
      </a-card>
    </a-dialog>

    <slot name="footer">
      <div></div>
    </slot>
  </a-card>
</template>

<script setup>
import { VueDraggable } from 'vue-draggable-plus';
import api from '@/services/api.service';
import { ref, reactive } from 'vue';

const props = defineProps({
  group: {
    required: true,
    type: Object,
  },
});

const state = reactive({
  drag: false,
  deleteModalIsVisible: false,
  deleteIndex: null,
  showAddDialog: false,
  newDoc: {
    label: null,
    link: null,
  },
  addToDescendants: false,
  removeFromDescendants: false,
  newIsValid: false,
  labelRules: [(v) => !!v || 'Label is required'],
  linkRules: [
    (v) => !!v || 'Link is required',
    (v) =>
      /[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)?/gi.test(v) || 'Invalid URL',
    (v) => !v || v.startsWith('https://') || v.startsWith('http://') || 'URL needs to start with https:// or http://',
  ],
});

const form = ref(null);

async function addEntry() {
  await form.value.validate();
  if (state.newIsValid) {
    await api.post('/groups/add-doc-link', {
      groupid: props.group._id,
      doc: state.newDoc,
      addToDescendants: state.addToDescendants,
    });
    if (!props.group.docs) {
      props.group.docs = [];
    }
    props.group.docs.push(state.newDoc);
    state.showAddDialog = false;
    state.newDoc = {
      label: null,
      link: null,
    };
    state.addToDescendants = false;
    await form.value.resetValidation();
  }
}
async function cancelAddEntry() {
  state.showAddDialog = false;
  state.newDoc = {
    label: null,
    link: null,
  };
  state.addToDescendants = false;
  await form.value.resetValidation();
}
function cancelDeleteEntry() {
  state.deleteModalIsVisible = false;
  state.removeFromDescendants = false;
}
function showDeleteModal(index) {
  state.deleteModalIsVisible = true;
  state.deleteIndex = index;
}
function handleConfirmDelete() {
  removeAt(state.deleteIndex);
  state.deleteModalIsVisible = false;
}
async function removeAt(idx) {
  await api.post('/groups/remove-doc-link', {
    groupid: props.group._id,
    doc: props.group.docs[idx],
    removeFromDescendants: state.removeFromDescendants,
  });
  props.group.docs.splice(idx, 1);
  state.removeFromDescendants = false;
}
</script>
