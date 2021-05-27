<template>
  <v-card min-height="50vh">
    <v-card-title>
      Survey Reference Editor
      <!-- <v-spacer />
      <v-btn
        icon
        @click="$emit('delete', resource.id)"
      >
        <v-icon>mdi-delete</v-icon>
      </v-btn> -->
    </v-card-title>
    <v-card-text>
      <!-- <v-select
        label="Select Survey"
        outlined
        :items="surveys"
        v-model="surveyId"
        @change="surveyChanged()"
        :loading="loading"
        item-value="_id"
        item-text="name"
      >
        <template slot="append-outer">
          <v-chip
            style="margin-top: -10px;"
            dark
            color="green"
            v-if="surveyVersion"
          >
            Survey Version {{ surveyVersion }}
          </v-chip>
        </template>
      </v-select> -->
      <v-autocomplete
        label="Select Survey"
        outlined
        :items="surveys"
        v-model="surveyId"
        @change="surveyChanged()"
        :loading="loading"
        item-value="_id"
        item-text="name"
      >
        <template slot="append-outer">
          <v-chip
            style="margin-top: -10px;"
            dark
            color="green"
            v-if="surveyVersion"
          >
            Survey Version {{ surveyVersion }}
          </v-chip>
        </template>
      </v-autocomplete>

      <template v-if="surveyId">
        <v-select
          label="Select Path"
          outlined
          @change="updateResource"
          :items="paths"
          v-model="path"
          :loading="loading"
          item-value="path"
          item-text="name"
        />
      </template>
    </v-card-text>
    <v-spacer />
    <v-card-actions>
      <v-spacer />
      <v-btn
        text
        @click="() => $emit('close-dialog')"
      >
        Close
      </v-btn>
      <v-btn
        text
        color="error"
        @click="deleteResource"
      >
        Delete
      </v-btn>
      <v-btn
        text
        color="primary"
        @click="updateAndClose"
      >
        Save
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import TreeModel from 'tree-model';
import api from '@/services/api.service';

export default {
  props: {
    resource: {
      type: Object,
      required: true,
      default: () => ({ content: [] }),
    },
    resources: {
      type: Array,
      required: true,
      default: () => ([]),
    },
    // value: {
    //   type: Object,
    //   required: true,
    // },
  },
  data: () => ({
    surveyId: '',
    surveyVersion: '',
    path: '',
    loading: false,
    surveys: [],
    paths: [],
    // limitToOwn: false,
  }),
  methods: {
    deleteResource() {
      this.$emit('delete', this.resource.id);
      this.$emit('close-dialog');
      this.clearUserState();
    },
    clearUserState() {
      this.surveyId = '';
      this.surveyVersion = '';
      this.path = '';
    },
    updateResource() {
      this.$emit('change', {
        ...this.resource,
        content: {
          id: this.surveyId,
          version: this.surveyVersion,
          path: this.path,
        },
      });
    },
    updateAndClose() {
      this.updateResource();
      this.$emit('close-dialog');
    },
    async surveyChanged(version) {
      console.log('surveychanged', this.surveyId);
      const { data } = await api.get(`/surveys/${this.surveyId}`);
      if (!version) {
        this.surveyVersion = data.latestVersion;
      }

      const revision = data.revisions.find((r) => {
        if (version) {
          return r.version === version;
        }
        return r.version === this.surveyVersion;
      });

      const tree = new TreeModel();
      const root = tree.parse({ name: 'data', children: revision.controls });
      const paths = [];
      root.walk((node) => {
        if (node.isRoot()) {
          return true;
        }
        if (node.hasChildren()) {
          return true;
        }
        const path = node.getPath().map(n => n.model.name).join('.');
        const control = node.model;
        const name = `${control.label} (${path})`;
        paths.push({
          node, path, control, name,
        });
        return true;
      });

      this.paths = paths;
      console.log('paths', paths);
    },
    async pathChanged() {
      // console.log('path changed');

      // this.$emit('input', {
      //   surveyId: this.surveyId,
      //   surveyVersion: this.surveyVersion,
      //   path: this.path,
      //   // limitToOwn: this.limitToOwn,
      // });
    },
  },
  async mounted() {
    // console.log('mounted', this.value);
    if (this.resource.content) {
    // if (this.value) {
      // this.surveyId = this.value.surveyId || '';
      // this.path = this.value.path || '';
      // this.surveyVersion = this.value.surveyVersion || '';
      // // this.limitToOwn = this.value.limitToOwn || false;
      this.surveyId = this.resource.content.surveyId || '';
      this.path = this.resource.content.path || '';
      this.surveyVersion = this.resource.content.surveyVersion || '';


      console.log('running surveyChanged', this.surveyVersion, this.surveyId);
      if (this.surveyVersion) {
        await this.surveyChanged(this.surveyVersion);
      }
    }

    this.loading = true;
    const { data } = await api.get('/surveys/list-page?limit=1000');
    this.surveys = data.content;
    this.loading = false;
  },
};
</script>

<style>

</style>
