<template>
  <div v-if="!showInvalidPlatformModal" style="height: 100%; padding: 16px">
    <survey-builder
      class="rounded"
      v-if="!loading.fetch"
      :key="sessionId"
      :survey="survey"
      :isSaving="loading.save"
      :isUpdating="loading.publish"
      :editMode="editModeLocal"
      :freshImport="freshImport"
      @submit="submitSubmission"
      @onSaveDraft="submitSurvey(true)"
      @onPublish="submitSurvey(false)"
      @onDelete="onDelete"
      @import-survey="importSurvey"
      @export-survey="exportSurvey"
      @show-version-dialog="versionsDialogIsVisible = true" />
    <div v-else class="d-flex align-center justify-center" style="height: 100%">
      <a-progress-circular :size="50" />
    </div>
    <app-dialog v-model="showConflictModal" @cancel="showConflictModal = false" @confirm="generateId">
      <template v-slot:title>Conflict 409</template>
      A survey with id
      <strong>{{ survey._id }}</strong> already exists. Do you want to generate a different id?
    </app-dialog>

    <app-dialog v-model="showDeleteModal" @cancel="showDeleteModal = false" @confirm="onDelete" width="400">
      <template v-slot:title>Confirm your action</template>
      Are you sure you want to delete survey
      <strong>{{ survey.name }}</strong> ({{ survey._id }})?
    </app-dialog>

    <app-dialog
      v-model="showOverrideModal"
      @cancel="showOverrideModal = false"
      @confirm="onOverride"
      labelConfirm="Dismiss unpublished changes"
      width="400">
      <template v-slot:title>Confirm your action</template>
      You have unpublished changes in your Draft. Importing a survey will dismiss these.
    </app-dialog>

    <a-dialog v-model="submitting" persistent width="300">
      <a-card>
        <a-card-text class="pa-4">
          <span>Submitting Builder</span>
          <a-progress-linear class="mb-0" />
        </a-card-text>
      </a-card>
    </a-dialog>

    <result-dialog
      v-model="showResult"
      :items="resultItems"
      title="Result of Response"
      additionalMessage="<span class='text-caption'>Note: responses from Builder are automatically archived. Please browse archived responses to view this result.</span>"
      :survey="survey"
      :submission="submission"
      @close="showResult = false" />

    <result-dialog
      v-model="showApiComposeErrors"
      :items="apiComposeErrors"
      title="ApiCompose Errors"
      :survey="survey"
      :submission="submission"
      @close="showApiComposeErrors = false" />

    <versions-dialog
      v-if="versionsDialogIsVisible"
      v-model="versionsDialogIsVisible"
      @cancel="versionsDialogIsVisible = false"
      :survey-id="survey._id"
      @reload-survey="onReloadSurvey" />

    <a-snackbar v-model="showSnackbar" :timeout="4000">
      {{ capitalizeSnackbarMessage }}
      <a-btn color="grey" variant="text" @click="showSnackbar = false">Close</a-btn>
    </a-snackbar>
  </div>
  <div
    v-else
    class="d-flex justify-center align-center overlay-bg"
    style="background: rgba(0, 0, 0, 0.45); height: 100%">
    <a-card max-width="500">
      <a-card-title>
        <a-icon class="mr-2 text-error">mdi-close-octagon</a-icon>
        Unsupported browser
      </a-card-title>
      <!-- <a-alert type="error">
        Unsupported browser
      </a-alert> -->
      <a-card-text>
        Safari is not currently supported in the Survey Builder, please use Firefox, Chrome, or another Chromium-based
        browser.
      </a-card-text>
    </a-card>
  </div>
</template>

<script>
import ObjectId from 'bson-objectid';
import appDialog from '@/components/ui/Dialog.vue';
import resultDialog from '@/components/ui/ResultDialog.vue';
import resultMixin from '@/components/ui/ResultsMixin';
import VersionsDialog from '@/components/builder/VersionsDialog';
import { createSurvey, updateControls } from '@/utils/surveys';
import { isIos, isSafari } from '@/utils/compatibility';
import { uploadFileResources } from '@/utils/resources';
import { getApiComposeErrors } from '@/utils/draft';
import downloadExternal from '@/utils/downloadExternal';
import api from '@/services/api.service';
import { defineAsyncComponent } from 'vue';

const SurveyBuilder = defineAsyncComponent(() => import('@/components/builder/SurveyBuilder.vue'));

export default {
  components: {
    VersionsDialog,
    SurveyBuilder,
    appDialog,
    resultDialog,
  },
  props: {
    id: {
      type: String,
      required: true,
    },
    surveyId: {
      type: String,
      required: false,
    },
    editMode: {
      type: Boolean,
      required: true,
    },
  },
  mixins: [resultMixin],
  data() {
    return {
      editModeLocal: null,
      showConflictModal: false,
      sessionId: new ObjectId().toString(),
      loading: {
        save: false,
        publish: false,
        fetch: false,
      },
      instance: {},
      survey: createSurvey({
        creator: this.$store.state.auth.user._id,
        group: this.getActiveGroupSimpleObject(),
      }),
      submission: null,
      showSnackbar: false,
      snackbarMessage: '',
      showDeleteModal: false,
      showOverrideModal: false,
      importedSurvey: null,
      freshImport: false,
      submitting: false,
      showInvalidPlatformModal: false,
      isIos: () => isIos(),
      apiComposeErrors: [],
      showApiComposeErrors: false,
      versionsDialogIsVisible: false,
    };
  },
  mounted() {
    if (isIos() || isSafari()) {
      this.showInvalidPlatformModal = true;
    }
  },
  computed: {
    capitalizeSnackbarMessage() {
      if (!this.snackbarMessage) return '';
      const v = this.snackbarMessage.toString();
      return v.charAt(0).toUpperCase() + v.slice(1);
    },
  },
  watch: {
    surveyId: {
      async handler(newVal, oldVal) {
        if (newVal !== oldVal) {
          await this.init();
        }
      },
    },
  },
  methods: {
    async init() {
      this.editModeLocal = this.editMode;
      if (this.editModeLocal) {
        this.loading.fetch = true;
        await this.fetchData();
      } else {
        this.survey._id = new ObjectId();
      }
    },
    getActiveGroupSimpleObject() {
      try {
        const groups = this.$store.getters['memberships/groups'];
        const { path } = groups.find(({ _id }) => _id === this.id);
        return {
          id: this.id,
          path,
        };
      } catch (error) {
        return { id: null, path: null };
      }
    },
    snack(message) {
      this.snackbarMessage = message;
      this.showSnackbar = true;
    },
    generateId() {
      this.survey._id = new ObjectId();
      this.showConflictModal = false;
    },
    async onDelete() {
      if (!this.showDeleteModal) {
        this.showDeleteModal = true;
        return;
      }
      try {
        await api.delete(`/surveys/${this.survey._id}`);
        this.$router.push({
          name: 'group-surveys',
        });
      } catch (error) {
        console.log(error);
      }
    },
    async submitSubmission({ payload }) {
      this.submission = null;
      this.apiComposeErrors = getApiComposeErrors(this.survey, payload);
      if (this.apiComposeErrors.length > 0) {
        this.showApiComposeErrors = true;
        return;
      }

      this.submitting = true;
      try {
        await uploadFileResources(this.$store, this.survey, payload, false);
        this.submission = {
          ...payload,
          meta: {
            ...payload.meta,
            archived: true,
            archivedReason: 'SUBMISSION_FROM_BUILDER',
          },
        };
        const response = await api.post('/submissions', this.submission);
        try {
          this.result({ response });
        } catch (error) {
          console.log('error parsing result from server', error);
        }
      } catch (error) {
        console.log('error', error);
        const { message } = error.response.data;
        console.log('message', message);
        this.apiComposeErrors = [{ body: message, error: true }];
        this.showApiComposeErrors = true;
        this.snack(message);
        console.log(error);
      }
      this.submitting = false;
    },
    async submitSurvey(isDraft) {
      if (isDraft) {
        this.loading.save = true;
      } else {
        this.loading.update = true;
      }

      this.freshImport = false;
      const tmp = { ...this.survey };

      if (!isDraft && tmp.revisions.length > 0) {
        tmp.latestVersion = tmp.revisions[tmp.revisions.length - 1].version;
      }

      console.log('submitting survey', tmp);

      try {
        if (this.editModeLocal) {
          await api.put(`/surveys/${tmp._id}`, tmp);
        } else {
          await api.post('/surveys', tmp);
          this.editModeLocal = true;
          this.$router.push(`/groups/${this.id}/surveys/${tmp._id}/edit`);
        }

        this.snack(isDraft ? 'Saved Draft' : 'Published Survey');

        this.sessionId = new ObjectId().toString();
        this.survey = { ...tmp };
      } catch (error) {
        if (error && error.response && error.response.status === 409) {
          this.showConflictModal = true;
        } else if (error && error.response && error.response.data) {
          const { message } = error.response.data;
          this.snack(message);
        } else {
          console.error(error);
        }
      }

      if (isDraft) {
        this.loading.save = false;
      } else {
        this.loading.update = false;
      }
    },
    async importSurvey({
      target: {
        files: [file],
      },
    }) {
      try {
        const importedSurvey = JSON.parse(await file.text());
        this.importedSurvey = importedSurvey;
        if (this.survey.revisions.length !== this.survey.latestVersion) {
          this.showOverrideModal = true;
        } else {
          this.onOverride();
        }
      } catch (err) {
        console.error('error parsing Survey file', err);
        this.snack(`error parsing Survey file:${err}`);
      }
    },
    onOverride() {
      this.showOverrideModal = false;
      try {
        // only keep latest revision of survey definition
        const filtered = this.survey.revisions.filter((r) => r.version <= this.survey.latestVersion);
        this.survey.revisions = filtered;
        const revision = { ...this.importedSurvey.revisions[this.importedSurvey.revisions.length - 1] };

        if (this.importedSurvey.specVersion === 1) {
          const migratedControls = updateControls(
            updateControls(revision.controls, { type: 'ontology', key: 'options.source', replacer: () => '' }),
            { type: /.*/, replacer: ({ _id, ...rest }) => ({ id: new ObjectId().toString(), ...rest }) }
          );
          revision.controls = migratedControls;
        }

        if (this.importedSurvey.meta.specVersion === 2) {
          this.importedSurvey.resources = this.importedSurvey.resources
            ? this.importedSurvey.resources.map(({ handle, ...rest }) => ({
                name: handle,
                id: new ObjectId().toString(),
                ...rest,
              }))
            : [];
        }

        // set new ObjectIDs for all controls
        revision.controls = updateControls(revision.controls, {
          type: /.*/,
          replacer: ({ id, ...rest }) => ({ id: new ObjectId().toString(), ...rest }),
        });

        // append imported survey definition as latest revision
        this.survey.revisions.push(revision);
        this.survey.resources = this.importedSurvey.resources ? this.importedSurvey.resources : [];
        revision.version = this.survey.latestVersion + 1;
        this.freshImport = true;

        const id = new ObjectId().toString();
        this.sessionId = id;
      } catch (err) {
        console.error('error parsing Survey file', err);
        this.snack(`error parsing Survey file:${err}`);
      }
    },
    async exportSurvey() {
      const { data } = await api.get(`/surveys/${this.survey._id}?version=all`);
      const dataString = JSON.stringify(data, null, 4);
      downloadExternal(`data:text/plain;charset=utf-8,${encodeURIComponent(dataString)}`, `${this.survey.name}.json`);
    },
    async fetchData() {
      try {
        this.survey._id = this.surveyId;
        const { data } = await api.get(`/surveys/${this.survey._id}?version=latestPublishedOrDraft`);
        this.survey = { ...this.survey, ...data };
        // Fetch all resources into local storage
        if (this.survey.resources) {
          await this.$store.dispatch('resources/fetchResources', this.survey.resources, { root: true });
        }
      } catch (e) {
        console.log('something went wrong:', e);
      }
      this.sessionId = new ObjectId().toString();
      this.loading.fetch = false;
    },
    onReloadSurvey() {
      this.fetchData();
    },
  },
  async created() {
    await this.init();
  },
  beforeRouteLeave(to, from, next) {
    next(true);
  },
};
</script>

<style scoped lang="scss">
.overlay-bg {
  background-color: rgba(0, 0, 0, 0.45);
}
</style>
