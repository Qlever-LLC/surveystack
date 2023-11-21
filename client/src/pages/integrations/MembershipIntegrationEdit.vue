<template>
  <v-container>
    <v-card class="pa-4 mb-4">
      <span class="text--secondary overline">{{ this.entity._id }}</span>
      <h1>{{ editMode ? 'Edit Membership Integration' : 'Create Membership Integration' }}</h1>

      <a-form class="mt-3" @keydown.enter.prevent="submit">
        <a-text-field v-model="entity.name" label="Name" placeholder="Untitled integration" outlined />

        <a-select :items="integrationTypes" v-model="entity.type" label="Type" outlined />

        <app-farmos-farm-picker
          v-if="entity.type === 'farmos-farm'"
          :aggregators="aggregators"
          :data="entity.data"
          @farm-selected="
            (ev) => {
              entity.data = ev;
              entity.name = ev.name;
            }
          "
        />
        <app-json-editor v-model="entity.data" class="mt-3" />

        <div class="d-flex ma-2">
          <v-btn v-if="editMode" color="error" outlined @click="deleteEntity">
            <v-icon left>mdi-trash-can-outline</v-icon> Delete
          </v-btn>
          <v-btn class="ml-auto" text @click="cancel">Cancel</v-btn>
          <v-btn color="primary" @click="submit">Submit</v-btn>
        </div>
      </a-form>
    </v-card>
  </v-container>
</template>

<script>
import ObjectId from 'bson-objectid';
import api from '@/services/api.service';

import appJsonEditor from '@/components/ui/JsonEditor.vue';
import appFarmosFarmPicker from '@/components/integrations/FarmosFarmPicker.vue';

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
    value: 'farmos-farm',
    text: 'FarmOS Farm',
  },
];

export default {
  components: {
    appJsonEditor,
    appFarmosFarmPicker,
  },
  data() {
    return {
      editMode: true,
      integrationTypes,
      entity: {
        _id: '',
        name: '',
        membership: '',
        type: 'generic',
        data: {},
      },
      aggregators: [],
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
      if (this.entity.name.trim() === '') {
        console.log('Name must not be empty');
        // return;
      }

      try {
        if (this.editMode) {
          await api.put(`/membership-integrations/${this.entity._id}`, this.entity);
        } else {
          await api.post('/membership-integrations', this.entity);
        }

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
  watch: {
    'entity.type': {
      async handler(newVal) {
        if (newVal === 'farmos-farm') {
          const m = await api.get(`/memberships/${this.entity.membership}`);

          const gi = await api.get(`/group-integrations?group=${m.data.group}&type=farmos-aggregator&populate=true`);
          this.aggregators = [];
          gi.data.forEach(async (aggregator) => {
            const { data } = await api.get(`/farmos/integrations/${aggregator._id}/farms`);
            const a = {
              _id: aggregator._id,
              text: aggregator.name,
              value: aggregator._id,
              url: aggregator.data.url,
              farms: [...data],
            };
            this.aggregators.push(a);
          });
        }
      },
    },
  },
  async created() {
    this.editMode = !this.$route.matched.some(({ name }) => name === 'membership-integrations-new');

    this.entity._id = new ObjectId();
    const { membership } = this.$route.query;
    if (membership) {
      this.entity.membership = membership;
    }

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
