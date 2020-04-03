<template>
  <v-container>
    <h1>{{ editMode ? "Edit Membership Integration" : "Create Membership Integration" }}</h1>
    <span class="text--secondary">{{this.entity._id}}</span>
    <v-card class="pa-4 mb-4">
      <v-form
        class="mt-3"
        @keydown.enter.prevent="submit"
      >
        <v-text-field
          v-model="entity.name"
          label="Name"
          placeholder="Untitled integration"
          outlined
        />

        <v-select
          :items="integrationTypes"
          v-model="entity.type"
          label="Type"
          outlined
        ></v-select>

        <app-json-editor v-model="entity.data" />
        <div class="d-flex ma-2">
          <v-btn
            color="error"
            outlined
            class="mr-auto"
            @click="deleteEntity"
          >
            <v-icon left>mdi-trash-can-outline</v-icon> Delete
          </v-btn>
          <v-btn
            text
            @click="cancel"
          >Cancel</v-btn>
          <v-btn
            color="primary"
            @click="submit"
          >Submit</v-btn>
        </div>
      </v-form>
    </v-card>
  </v-container>
</template>

<script>
import ObjectId from 'bson-objectid';
import api from '@/services/api.service';

import appJsonEditor from '@/components/ui/JsonEditor.vue';


const exampleIntegration = {
  type: 'farmos-aggregator',
  name: 'FarmOS Aggregator RFC',
  url: 'oursci.farmos.group',
  apiKey: '1234',
  parameters: 'rfc,nofa',
};

const integrationTypes = [
  {
    value: 'generic',
    text: 'Generic',
  },
  {
    value: 'farmos-farm',
    text: 'FarmOS Farm',
  },
];

export default {
  components: {
    appJsonEditor,
  },
  data() {
    return {
      editMode: true,
      integrationTypes,
      entity: {
        _id: '',
        membership: '',
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
      const data = this.entity;
      const method = this.editMode ? 'put' : 'post';
      const url = this.editMode ? `/membership-integrations/${this.entity._id}` : '/membership-integrations';

      if (this.entity.name.trim() === '') {
        console.log('Name must not be empty');
        // return;
      }

      try {
        await api.customRequest({
          method,
          url,
          data,
        });

        this.$router.back();
      } catch (err) {
        console.log(err);
      }
    },
    async deleteEntity() {
      await api.delete(`/membership-integrations/${this.entity._id}`);
      this.$router.back();
    },
  },
  computed: {
    passwordHint() {
      if (this.editMode) {
        return 'Leave blank for no changeee';
      }
      return '';
    },
  },
  async created() {
    this.editMode = !this.$route.matched.some(
      ({ name }) => name === 'membership-integrations-new',
    );

    this.entity._id = new ObjectId();

    if (this.editMode) {
      try {
        const { id } = this.$route.params;
        const { data } = await api.get(`/membership-integrations/${id}`);
        this.entity = { ...this.entity, ...data };
      } catch (e) {
        console.log('something went wrong:', e);
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
