<template>
  <a-card class="pb-2">
    <a-card-title
      >Documentation Links
      <a-spacer />
      <a-btn color="primary" text @click="showAddDialog = true">New.. </a-btn>
    </a-card-title>
    <a-card-subtitle>Custom links which appear in the side menu when logged into your group</a-card-subtitle>
    <draggable
      v-if="group.docs && group.docs.length !== 0"
      class="draggable list-group"
      tag="div"
      :list="group.docs"
      :group="{ name: 'g1' }"
      :invertSwap="true"
      :dragOptions="{ animation: 200 }"
      @start="drag = true"
      @end="drag = false"
    >
      <a-card v-for="(el, idx) in group.docs" :key="el.link + idx" class="ma-2 mx-6" elevation="1" outlined>
        <a-card-text>
          <div class="d-flex justify-space-between align-center">
            <div>
              <span class="title">{{ el.label }}</span>
              <br />
              <a :href="el.link" target="_blank">{{ el.link }}</a>
            </div>
            <div class="d-flex">
              <a-btn icon @click.stop="() => showDeleteModal(idx)">
                <a-icon color="grey lighten-1">mdi-delete</a-icon>
              </a-btn>
            </div>
          </div>
        </a-card-text>
      </a-card>
    </draggable>
    <a-card class="ma-2" outlined elevation="1" v-else>
      <a-card-text>
        <span class="title text--secondary">No documentation links yet</span><br />
        <span class="font-weight-light grey--text text--darken-2"
          >You can add documentation links from the menu in the top right</span
        >
      </a-card-text>
    </a-card>
    <a-dialog v-model="deleteModalIsVisible" max-width="290">
      <a-card>
        <a-card-title> Remove Documentation </a-card-title>
        <a-card-text class="mt-4">
          <a-checkbox
            v-model="removeFromDescendants"
            label="Also remove this documentation link from all descendant groups"
            hide-details
          />
        </a-card-text>
        <a-card-text class="mt-4"> Are you sure you want to remove this documentation link? </a-card-text>
        <a-card-actions>
          <a-spacer />
          <a-btn text @click.stop="cancelDeleteEntry"> Cancel </a-btn>
          <a-btn text color="red" @click.stop="handleConfirmDelete"> Remove </a-btn>
        </a-card-actions>
      </a-card>
    </a-dialog>

    <a-dialog v-model="showAddDialog" max-width="500">
      <a-card>
        <a-card-title>Add documentation link</a-card-title>
        <a-card-text>
          <a-form v-model="newIsValid" ref="form">
            <a-text-field class="mt-3" v-model="newDoc.label" label="Label" outlined required :rules="labelRules" />

            <a-text-field class="mt-3" v-model="newDoc.link" label="Link" outlined required :rules="linkRules" />

            <a-checkbox
              v-model="addToDescendants"
              label="Also add this documentation link to all descendant groups"
              hide-details
            />
          </a-form>
        </a-card-text>
        <a-card-actions>
          <a-spacer />
          <a-btn text @click.stop="cancelAddEntry"> Cancel </a-btn>
          <a-btn text color="primary" @click.stop="addEntry"> Submit </a-btn>
        </a-card-actions>
      </a-card>
    </a-dialog>

    <slot name="footer">
      <div></div>
    </slot>
  </a-card>
</template>

<script>
import draggable from 'vuedraggable';
import api from '@/services/api.service';
import ABtn from '@/components/ui/ABtn.vue';

export default {
  name: 'nested-draggable',
  components: {
    ABtn,
    draggable,
  },
  data() {
    return {
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
          /[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)?/gi.test(v) ||
          'Invalid URL',
        (v) =>
          !v || v.startsWith('https://') || v.startsWith('http://') || 'URL needs to start with https:// or http://',
      ],
    };
  },
  props: {
    group: {
      required: true,
      type: Object,
    },
  },
  mounted() {},
  methods: {
    async addEntry() {
      this.$refs.form.validate();
      if (this.newIsValid) {
        await api.post('/groups/add-doc-link', {
          groupid: this.group._id,
          doc: this.newDoc,
          addToDescendants: this.addToDescendants,
        });
        if (!this.group.docs) {
          this.group.docs = [];
        }
        this.group.docs.push(this.newDoc);
        this.showAddDialog = false;
        this.newDoc = {
          label: null,
          link: null,
        };
        this.addToDescendants = false;
        this.$refs.form.resetValidation();
      }
    },
    cancelAddEntry() {
      this.showAddDialog = false;
      this.newDoc = {
        label: null,
        link: null,
      };
      this.addToDescendants = false;
      this.$refs.form.resetValidation();
    },
    cancelDeleteEntry() {
      this.deleteModalIsVisible = false;
      this.removeFromDescendants = false;
    },
    showDeleteModal(index) {
      this.deleteModalIsVisible = true;
      this.deleteIndex = index;
    },
    handleConfirmDelete() {
      this.removeAt(this.deleteIndex);
      this.deleteModalIsVisible = false;
    },
    async removeAt(idx) {
      await api.post('/groups/remove-doc-link', {
        groupid: this.group._id,
        doc: this.group.docs[idx],
        removeFromDescendants: this.removeFromDescendants,
      });
      this.group.docs.splice(idx, 1);
      this.removeFromDescendants = false;
    },
  },
};
</script>
