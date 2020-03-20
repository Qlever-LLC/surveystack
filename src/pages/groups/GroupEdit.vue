<template>
  <v-container>
    <h1>{{editMode ? "Edit group" : "Create group"}}</h1>

    <form
      @submit.prevent="onSubmit"
      autocomplete="off"
    >
      <v-text-field
        label="Name"
        placeholder="Enter group name"
        id="group-name"
        autocomplete="off"
        v-model="entity.name"
      />
      <v-text-field
        label="Slug"
        placeholder="Enter group slug or use suggested"
        id="group-slug"
        v-model="entity.slug"
        :readonly="!editSlug"
        :append-icon="editSlug ? 'mdi-pencil-off-outline' : 'mdi-pencil-outline'"
        autocomplete="off"
        @click:append="editSlug = !editSlug"
        hint="URL friendly version of name"
        persistent-hint
      />

      <div class="d-flex justify-end">
        <v-btn
          text
          @click="cancel"
        >Cancel</v-btn>
        <v-btn
          color="primary"
          type="submit"
        >{{editMode ? "Save" : "Create"}}</v-btn>
      </div>

    </form>
    <small>path={{entity.path | showNull}}</small>
  </v-container>
</template>

<script>
import ObjectId from 'bson-objectid';
import api from '@/services/api.service';

import { handleize } from '@/utils/groups';

export default {
  data() {
    return {
      editSlug: false,
      entity: {
        _id: '',
        name: '',
        slug: '',
        path: null,
      },
    };
  },
  methods: {
    async onSubmit() {
      if (this.entity.name.trim() === '') {
        console.log('name must not be empty');
        return;
      }

      if (this.entity.slug.trim() === '') {
        console.log('slug must not be empty');
        return;
      }

      const data = this.entity;
      const method = this.editMode ? 'put' : 'post';
      const url = this.editMode ? `/groups/${this.entity._id}` : '/groups';

      try {
        await api.customRequest({
          method,
          url,
          data,
        });
        this.$router.push(
          `/g/${this.entity.path ? this.entity.path : ''}${
            this.entity.slug
          }`,
        );
      } catch (err) {
        console.log(err);
      }
    },
    cancel() {
      if (!this.entity.path) {
        this.$router.replace({ name: 'groups-list' });
        return;
      }

      this.$router.replace(`/g${this.entity.path}`);
    },
  },
  watch: {
    'entity.name': {
      handler(newVal, oldVal) {
        if (!this.editMode) {
          const handle = handleize(newVal);
          this.entity.slug = handle;
        }
      },
    },
    'entity.slug': {
      handler(newVal, oldVal) {
        const handle = handleize(newVal);
        this.entity.slug = handle;
      },
    },
  },
  async created() {
    this.editMode = !this.$route.matched.some(
      ({ name }) => name === 'groups-new',
    );

    if (this.$route.query.path) {
      this.entity.path = this.$route.query.path;
    }

    this.entity._id = new ObjectId();

    if (this.editMode) {
      try {
        const { id } = this.$route.params;
        const { data } = await api.get(`/groups/${id}`);
        this.entity = { ...this.entity, ...data };
      } catch (e) {
        console.log('something went wrong:', e);
      }
    }
  },
};
</script>
