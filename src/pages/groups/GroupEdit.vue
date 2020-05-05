<template>
  <v-container>
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

    <v-row>
      <v-col
        cols="12"
        lg="6"
      >
        <app-pinned-surveys
          class="mb-4"
          v-if="editMode"
          :entities="entity.surveys.pinned"
          :searchResults="searchResults"
          @search="searchSurveys"
        >

        </app-pinned-surveys>
      </v-col>
      <v-col
        cols="12"
        lg="6"
      >
        <v-card
          v-if="editMode"
          class="mb-4"
        >
          <app-integration-list
            title="Group Integrations"
            :entities="integrations"
            integrationType="group"
            :newRoute="{name: 'group-integrations-new', query: {group: entity._id}}"
          />
        </v-card>
      </v-col>
    </v-row>

    <app-basic-list
      editable
      class="mb-4"
      v-if="editMode"
      :entities="members"
      title="Members"
      :link="(member) => `/memberships/${member._id}/edit`"
      :linkNew="{name: 'memberships-new', query: {group: entity._id, role: 'user' }}"
      :filter="filterMembers"
    >
      <template v-slot:entity="{ entity }">
        <v-list-item-content v-if="entity.meta && entity.meta.status === 'pending'">
          <v-list-item-title class="text--secondary">[Pending] Invitation</v-list-item-title>
          <v-list-item-subtitle>sent to {{entity.meta.sentTo}}</v-list-item-subtitle>
        </v-list-item-content>

        <v-list-item-content v-else>
          <v-list-item-title>{{entity.user.name}}</v-list-item-title>
          <v-list-item-subtitle>{{entity.user.email}}</v-list-item-subtitle>
        </v-list-item-content>

        <v-list-item-action>
          <v-icon v-if="entity.role === 'admin'">mdi-crown-outline</v-icon>
        </v-list-item-action>
      </template>
    </app-basic-list>

  </v-container>
</template>

<script>
import ObjectId from 'bson-objectid';
import api from '@/services/api.service';
import appIntegrationList from '@/components/integrations/IntegrationList.vue';
import appPinnedSurveys from '@/components/groups/PinnedSurveys.vue';
import appBasicList from '@/components/ui/BasicList.vue';


import { handleize } from '@/utils/groups';

export default {
  components: {
    appIntegrationList,
    appPinnedSurveys,
    appBasicList,
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
        surveys: {
          pinned: [],
        },
      },
      integrations: [],
      searchResults: [],
      members: [],
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
        this.$store.dispatch('feedback/add', err.response.data.message);
        console.log(err);
      }
    },
    cancel() {
      this.$router.back();
    },
    async searchSurveys(q) {
      const { data: searchResults } = await api.get(`/surveys?projections[]=name&projections[]=dateModified&q=${q}`);
      this.searchResults = searchResults;
    },
    filterMembers(entities, q) {
      if (!q) {
        return entities;
      }
      const ql = q.toLowerCase();

      return entities.filter((entity) => {
        if (entity.user) {
          if (entity.user.name.toLowerCase().indexOf(ql) > -1) {
            return true;
          }

          if (entity.user.email.toLowerCase().startsWith(ql)) {
            return true;
          }
        } else if (entity.meta.sentTo) {
          if (entity.meta.sentTo.toLowerCase().indexOf(ql) > -1) {
            return true;
          }
        }

        return false;
      });
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
        const { data } = await api.get(`/groups/${id}?populate=true`);
        this.entity = { ...this.entity, ...data };

        const { data: members } = await api.get(`/memberships?group=${this.entity._id}&populate=true`);
        this.members = members;

        const { data: integrations } = await api.get(`/group-integrations?group=${id}`);
        this.integrations = integrations;
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
