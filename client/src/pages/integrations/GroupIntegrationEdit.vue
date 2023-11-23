<template>
  <a-container>
    <a-card class="pa-4 mb-4">
      <span class="text--secondary overline">{{ this.entity._id }}</span>

      <h1>{{ editMode ? 'Edit Group Integration' : 'Create Group Integration' }}</h1>

      <a-form class="mt-3" @keydown.enter.prevent="submit">
        <a-text-field v-model="entity.name" label="Name" placeholder="Untitled integration" outlined />

        <a-select :items="integrationTypes" v-model="entity.type" label="Type" outlined />

        <app-json-editor v-model="entity.data" />
        <div class="d-flex ma-2">
          <a-btn color="error" outlined class="mr-auto" @click="deleteEntity">
            <a-icon left>mdi-trash-can-outline</a-icon> Delete
          </a-btn>
          <a-btn text @click="cancel">Cancel</a-btn>
          <a-btn color="primary" @click="submit">Submit</a-btn>
        </div>
      </a-form>
    </a-card>
    <transition name="fade">
      <app-feedback v-if="status" class="mt-5" @closed="status = ''">{{ status }}</app-feedback>
    </transition>
  </a-container>
</template>

<script>
import ObjectId from 'bson-objectid';
import api from '@/services/api.service';

import appJsonEditor from '@/components/ui/JsonEditor.vue';
import appFeedback from '@/components/ui/Feedback.vue';
import ABtn from '@/components/ui/ABtn.vue';

// const exampleIntegration = {
//   type: 'farmos-aggregator',
//   name: 'FarmOS Aggregator RFC',
//   url: 'oursci.farmos.group',
//   apiKey: '1234',
//   parameters: 'rfc,nofa',
// };

const integrationTypes = [
  {
    value: 'generic',
    text: 'Generic',
  },
  {
    value: 'farmos-aggregator',
    text: 'FarmOS Aggregator',
  },
];

export default {
  components: {
    ABtn,
    appJsonEditor,
    appFeedback,
  },
  data() {
    return {
      editMode: true,
      status: '',
      integrationTypes,
      entity: {
        _id: '',
        group: '',
        type: 'generic',
        name: '',
        data: {
          url: '',
          apiKey: '',
          parameters: '',
        },
      },
    };
  },
  methods: {
    cancel() {
      this.$router.back();
    },
    updateCode(code) {
      this.entity.content = code;
    },
    async submit() {
      try {
        if (this.editMode) {
          await api.put(`/group-integrations/${this.entity._id}`, this.entity);
        } else {
          await api.post('/group-integrations', this.entity);
        }

        this.$router.back();
      } catch (err) {
        console.log(err);
        this.status = err.response.data.message;
      }
    },
    async deleteEntity() {
      try {
        await api.delete(`/group-integrations/${this.entity._id}`);
        this.$router.back();
      } catch (err) {
        this.status = err.response.data.message;
      }
    },
  },
  async created() {
    this.editMode = !this.$route.matched.some(({ name }) => name === 'group-integrations-new');

    this.entity._id = new ObjectId();
    const { group } = this.$route.query;
    if (group) {
      this.entity.group = group;
    }

    if (this.editMode) {
      try {
        const { id } = this.$route.params;
        const { data } = await api.get(`/group-integrations/${id}`);
        this.entity = { ...this.entity, ...data };
      } catch (err) {
        console.log('something went wrong:', err);
        this.status = err.response.data.message;
      }
    }
  },
};
</script>

<style scoped>
.code-editor {
  height: 77vh;
}
</style>
