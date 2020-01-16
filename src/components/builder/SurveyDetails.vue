<template>
  <div>
    <app-modal
      v-if="showDeleteModal"
      @cancel="showDeleteModal = false"
      @confirm="onDelete"
      labelConfirm="Delete"
    >
      <template v-slot:header>Confirm your action</template>
      <template v-slot:body>
        Delete survey
        <strong>{{value._id}}</strong> for sure?
      </template>
    </app-modal>
    <app-modal
      v-if="showConflictModal"
      @cancel="showConflictModal = false"
      @confirm="regenerateId"
      labelConfirm="Generate"
    >
      <template v-slot:header>Conflict 409</template>
      <template v-slot:body>
        A survey with id
        <strong>{{value._id}}</strong> already exists. Do you want to generate a different id?
      </template>
    </app-modal>
    <v-form>
      <v-text-field v-model="value.name" label="Name" />
      <v-text-field v-model="value._id" label="id" readonly />
      <div class="form-group">
        <label for="survey-id">id</label>
        <input class="form-control" v-model="value._id" id="survey-id" readonly />
      </div>
      <div class="d-flex justify-content-end">
        <button type="button" class="btn btn-outline-secondary mr-2" @click.prevent="cancel">Cancel</button>
        <button
          v-if="editMode"
          type="button"
          class="btn btn-outline-danger mr-2"
          @click.prevent="showDeleteModal = true"
        >Delete</button>
        <button type="submit" class="btn btn-primary" @click.prevent="onSubmit">{{submitText}}</button>
      </div>
    </v-form>
  </div>
</template>

<script>
import ObjectId from 'bson-objectid';

import api from '@/services/api.service';

export default {
  props: ['value', 'editMode'],
  computed: {
    submitText() {
      return this.editMode ? 'Update Survey' : 'Create Survey';
    },
  },
  methods: {
    submit() {
      this.$emit('submit');
    },
    regenerateId() {
      this.value._id = new ObjectId();
    },
    cancel() {
      this.$router.push('/surveys');
    },
    async onDelete() {
      this.showDeleteModal = false;
      try {
        await api.delete(`/surveys/${this.value._id}`);
        this.$router.push('/surveys');
      } catch (error) {
        console.log(error);
      }
    },
    async onSubmit() {
      const method = this.editMode ? 'put' : 'post';
      const url = this.editMode ? `/surveys/${this.value._id}` : '/surveys';

      try {
        await api.customRequest({ method, url, data: this.value });
        this.$router.push('/surveys');
      } catch (error) {
        console.log(error.response);
        if (error.response.status === 409) {
          this.showConflictModal = true;
        }
      }
    },
  },
  data() {
    return {
      showDeleteModal: false,
      showConflictModal: false,
    };
  },
};
</script>
