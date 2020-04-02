<template>
  <v-container>
    <small>{{entity.dir}}</small>

    <h1>{{editMode ? "Edit group" : "Create group"}}</h1>

    <v-card class="pa-4 mb-4">
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

        <div class="d-flex justify-end pa-2">
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
    </v-card>

    <v-card v-if="editMode">
      <app-integration-list
        :entities="integrations"
        :group="entity._id"
      />
    </v-card>

  </v-container>
</template>

<script>
import ObjectId from 'bson-objectid';
import api from '@/services/api.service';
import appIntegrationList from '@/components/integrations/IntegrationList.vue';

import { handleize } from '@/utils/groups';

export default {
  components: {
    appIntegrationList,
  },
  data() {
    return {
      editSlug: false,
      editMode: true,
      entity: {
        _id: '',
        name: '',
        slug: '',
        dir: '/',
        path: '',
      },
      integrations: [],
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
        this.$router.push(`/g${this.entity.dir}${this.entity.slug}/`);
      } catch (err) {
        console.log(err);
      }
    },
    cancel() {
      if (this.entity.dir === '/') {
        this.$router.replace('/groups');
        return;
      }
      this.$router.replace(`/g${this.entity.dir}${this.entity.slug}/`);
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

    const { dir } = this.$route.query;
    if (dir) {
      this.entity.dir = dir;
      if (!this.entity.dir.endsWith('/')) {
        this.entity.dir += '/';
      }
    }

    this.entity._id = new ObjectId().toString();

    if (this.editMode) {
      try {
        const { id } = this.$route.params;
        const { data } = await api.get(`/groups/${id}`);
        this.entity = { ...this.entity, ...data };

        const i = await api.get(`/integrations?group=${id}`);
        this.integrations = i.data;
      } catch (e) {
        console.log('something went wrong:', e);
      }
    }
  },
};
</script>

<style scoped>
.api-border {
  border: 1px solid rgba(0, 0, 0, 0.24);
  border-radius: 4px;
}
</style>
