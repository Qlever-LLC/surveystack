<template>
  <v-container>
    <span class="text--secondary overline">{{this.entity._id}}</span>
    <h1>{{ editMode ? "Edit Membership" : "Create Membership" }}</h1>

    <v-card class="pa-4 mb-4">
      <v-form
        class="mt-3"
        @keydown.enter.prevent="submit"
      >
        <v-text-field
          v-model="entity.group"
          label="Group"
          outlined
        />

        <v-text-field
          v-model="entity.user"
          label="User"
          outlined
        />

        <v-select
          :items="availableRoles"
          v-model="entity.role"
          label="Role"
          outlined
        ></v-select>

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
    </v-card>

    <v-card v-if="editMode">
      <app-integration-list
        title="Membership Integrations"
        :entities="integrations"
        :newRoute="{name: 'membership-integrations-new', query: {membership: entity._id}}"
        integrationType="membership"
      />
    </v-card>
  </v-container>
</template>

<script>
import ObjectId from 'bson-objectid';
import api from '@/services/api.service';
import appIntegrationList from '@/components/integrations/IntegrationList.vue';

const availableRoles = [
  {
    value: 'user',
    text: 'User',
  },
  {
    value: 'admin',
    text: 'Admin',
  },
];

export default {
  components: {
    appIntegrationList,
  },
  data() {
    return {
      editMode: true,
      availableRoles,
      entity: {
        _id: '',
        user: '',
        group: '',
        role: '',
      },
      integrations: [],
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
      const url = this.editMode ? `/memberships/${this.entity._id}` : '/memberships';

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
      ({ name }) => name === 'memberships-new',
    );

    this.entity._id = new ObjectId();

    if (this.editMode) {
      try {
        const { id } = this.$route.params;
        const { data } = await api.get(`/memberships/${id}`);
        this.entity = { ...this.entity, ...data };

        const i = await api.get(`/membership-integrations?membership=${id}`);
        this.integrations = i.data;
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
