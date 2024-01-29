<template>
  <a-card>
    <a-card-title> Survey Reference Editor </a-card-title>
    <a-card-text>
      <a-select
        label="Select Survey"
        variant="outlined"
        :items="surveys"
        v-model="surveyId"
        @update:modelValue="surveyChanged()"
        :loading="loading"
        item-value="_id"
        item-title="name"
        appendSlot>
        <template v-slot:append>
          <a-chip style="margin-top: -10px" color="green" v-if="surveyVersion">
            Survey Version {{ surveyVersion }}
          </a-chip>
        </template>
      </a-select>

      <template v-if="surveyId">
        <a-select
          label="Select Path"
          variant="outlined"
          :items="paths"
          v-model="path"
          @update:modelValue="updateResource"
          :loading="loading"
          item-value="path"
          item-title="name" />
      </template>
    </a-card-text>
    <a-spacer />
    <a-card-actions>
      <a-spacer />
      <a-btn variant="text" @click="closeHandler"> Close </a-btn>
      <a-btn variant="text" color="green" @click="previewDialogIsVisible = true" :disabled="!path">
        Preview
        <a-tooltip top activator="parent" :disabled="!!path">No Submitted Surveys Available</a-tooltip>
      </a-btn>
      <a-btn variant="text" color="error" @click="deleteResource"> Delete </a-btn>
      <a-btn variant="text" color="primary" @click="updateAndClose"> Save </a-btn>
    </a-card-actions>

    <ontology-reference-preview v-model="previewDialogIsVisible" :resource="resource" />
  </a-card>
</template>

<script>
import TreeModel from 'tree-model';
import api from '@/services/api.service';
import OntologyReferencePreview from './OntologyReferencePreview.vue';

function getSurveyById(surveys, id) {
  return surveys.find((s) => s._id === id);
}

function getPathByPath(paths, path) {
  return paths.find((p) => p.path === path);
}

export default {
  components: {
    OntologyReferencePreview,
  },
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
      if (!path) return;
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
      if (!this.surveyId) return;
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
