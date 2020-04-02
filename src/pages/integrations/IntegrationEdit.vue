<template>
  <v-container>
    <h1>{{ editMode ? "Edit integration" : "Create integration" }}</h1>
    <span class="text--secondary">{{this.entity._id}}</span>
    <v-form
      class="mt-3"
      @keydown.enter.prevent="submit"
    >
      <v-text-field
        v-model="entity.name"
        label="Name"
        outlined
      />

      <v-select
        :items="integrationTypes"
        v-model="entity.type"
        label="Type"
        outlined
      ></v-select>

      <app-json-editor v-model="entity.data" />
      <div class="d-flex mt-2 justify-end">

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
    value: 'farmos-aggregator',
    text: 'FarmOS Aggregator',
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
        type: '',
        name: '',
        data: '',
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
      const url = this.editMode ? `/integrations/${this.entity._id}` : '/integrations';

      if (this.entity.name.trim() === '') {
        console.log('Name must not be empty');
        return;
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
  },
  computed: {
    passwordHint() {
      if (this.editMode) {
        return 'Leave blank for no change';
      }
      return '';
    },
  },
  async created() {
    this.editMode = !this.$route.matched.some(
      ({ name }) => name === 'integrations-new',
    );

    this.entity._id = new ObjectId();

    if (this.editMode) {
      try {
        const { id } = this.$route.params;
        const { data } = await api.get(`/integrations/${id}`);
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
