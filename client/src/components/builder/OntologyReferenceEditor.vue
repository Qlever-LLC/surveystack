<template>
  <v-card>
    <v-card-title> Survey Reference Editor </v-card-title>
    <v-card-text>
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
          <v-chip style="margin-top: -10px" dark color="green" v-if="surveyVersion">
            Survey Version {{ surveyVersion }}
          </v-chip>
        </template>
      </v-autocomplete>

      <template v-if="surveyId">
        <v-autocomplete
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
    <a-spacer />
    <v-card-actions>
      <a-spacer />
      <v-btn text @click="closeHandler"> Close </v-btn>
      <v-tooltip top :disabled="!!path">
        <template v-slot:activator="{ on }">
          <div v-on="on">
            <v-btn text color="green" @click="previewDialogIsVisible = true" :disabled="!path"> Preview </v-btn>
          </div>
        </template>
        <span>No Submitted Surveys Available</span>
      </v-tooltip>
      <v-btn text color="error" @click="deleteResource"> Delete </v-btn>
      <v-btn text color="primary" @click="updateAndClose"> Save </v-btn>
    </v-card-actions>

    <ontology-reference-preview v-model="previewDialogIsVisible" :resource="resource" />
  </v-card>
</template>

<script>
import TreeModel from 'tree-model';
import api from '@/services/api.service';
import OntologyReferencePreview from './OntologyReferencePreview.vue';
import ASpacer from '@/components/ui/ASpacer.vue';

function getSurveyById(surveys, id) {
  return surveys.find((s) => s._id === id);
}

function getPathByPath(paths, path) {
  return paths.find((p) => p.path === path);
}

export default {
  components: { OntologyReferencePreview, ASpacer },
  props: {
    resource: {
      type: Object,
      required: true,
      default: () => ({ content: [] }),
    },
    resources: {
      type: Array,
      required: true,
      default: () => [],
    },
  },
  data: () => ({
    surveyId: '',
    surveyVersion: '',
    path: '',
    loading: true,
    surveys: [],
    paths: [],
    previewDialogIsVisible: false,
  }),
  methods: {
    deleteResource() {
      this.$emit('delete', this.resource.id);
      this.$emit('close-dialog');
      this.clearUserState();
    },
    closeHandler() {
      this.$emit('close-dialog');
      this.clearUserState();
    },
    clearUserState() {
      this.surveyId = '';
      this.surveyVersion = '';
      this.path = '';
    },
    updateResource() {
      const survey = getSurveyById(this.surveys, this.surveyId);
      const path = getPathByPath(this.paths, this.path);
      this.$emit('change', {
        ...this.resource,
        label: `${survey && survey.name} - ${path.control.label}`,
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
      const versionParam = version || 'latest';
      const { data } = await api.get(`/surveys/${this.surveyId}?version=${versionParam}`);
      if (!version) {
        this.surveyVersion = data.latestVersion;
      }

      const tree = new TreeModel();
      const root = tree.parse({ name: 'data', children: data.revisions[0].controls });
      const paths = [];
      root.walk((node) => {
        if (node.isRoot()) {
          return true;
        }
        if (node.hasChildren()) {
          return true;
        }
        const path = node
          .getPath()
          .map((n) => n.model.name)
          .join('.');
        const control = node.model;
        const name = `${control.label} (${path})`;
        paths.push({
          node,
          path,
          control,
          name,
        });
        return true;
      });

      this.paths = paths;
    },
  },
  watch: {
    surveyId() {
      if (!this.loading) {
        this.path = '';
      }
    },
  },
  async mounted() {
    if (this.resource.content) {
      this.surveyId = this.resource.content.id || '';
      this.path = this.resource.content.path || '';
      this.surveyVersion = this.resource.content.version || '';

      if (this.surveyVersion) {
        await this.surveyChanged(this.surveyVersion);
      }
    }

    const { data } = await api.get('/surveys/list-page?limit=1000');
    this.surveys = data.content;
    this.loading = false;
  },
};
</script>

<style></style>
