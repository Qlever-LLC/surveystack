<template>
  <v-container>
    <app-dialog v-model="deleteDialog" @cancel="deleteDialog = false" @confirm="onDelete">
      <template v-slot:title>Confirm your action</template>
      <template>
        Delete survey
        <strong>{{survey._id}}</strong>
        for sure?
      </template>
    </app-dialog>

    <app-dialog v-model="conflictDialog" @cancel="conflictDialog = false" @confirm="generateId">
      <template v-slot:title>Conflict 409</template>
      <template>
        A survey with id
        <strong>{{survey._id}}</strong> already exists. Do you want to generate a different id?
      </template>
    </app-dialog>

    <v-row>
      <v-col cols="7">
        <div class="d-flex justify-space-between align-center">
          <h2>Survey Builder</h2>
          <v-btn
            @click="showCode = !showCode"
            color="primary"
            small
            text
          >{{ showCode ? "graphical" : "code"}}</v-btn>
        </div>

        <graphical-view
          v-if="!showCode"
          :selected="control"
          :controls="survey.controls"
          @controlSelected="controlSelected"
        />
        <code-view v-else v-model="survey" />
      </v-col>
      <v-col cols="5">
        <div class="sticky-top">
          <h3>Details</h3>
          <survey-details
            v-model="survey"
            :editMode="editMode"
            @cancel="onCancel"
            @submit="onSubmit"
            @delete="onDelete"
          />
          <h3>Add questions</h3>
          <control-adder @controlAdded="controlAdded" />
          <h3>Properties</h3>
          <control-properties :control="control" :survey="survey" />
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import ObjectId from 'bson-objectid';
import api from '@/services/api.service';

import graphicalView from '@/components/builder/GraphicalView.vue';
import codeView from '@/components/builder/CodeView.vue';
import controlProperties from '@/components/builder/ControlProperties.vue';
import controlAdder from '@/components/builder/ControlAdder.vue';
import surveyDetails from '@/components/builder/SurveyDetails.vue';

import appDialog from '@/components/ui/Dialog.vue';

export default {
  components: {
    graphicalView,
    codeView,
    controlProperties,
    controlAdder,
    surveyDetails,
    appDialog,
  },
  data() {
    return {
      conflictDialog: false,
      deleteDialog: false,
      editMode: false,
      showCode: false,
      control: null,
      controls: [],
      survey: {
        name: '',
        _id: '',
        controls: [],
      },
    };
  },
  methods: {
    controlSelected(control) {
      this.control = control;
    },
    controlAdded(control) {
      this.survey.controls.push(control);
      this.control = control;
    },
    onCancel() {
      this.$router.push('/surveys');
    },
    generateId() {
      this.survey._id = new ObjectId();
      this.conflictDialog = false;
    },
    async onDelete() {
      if (!this.deleteDialog) {
        this.deleteDialog = true;
        return;
      }
      try {
        await api.delete(`/surveys/${this.survey._id}`);
        this.$router.push('/surveys');
      } catch (error) {
        console.log(error);
      }
    },
    async onSubmit() {
      const method = this.editMode ? 'put' : 'post';
      const url = this.editMode ? `/surveys/${this.survey._id}` : '/surveys';

      try {
        await api.customRequest({ method, url, data: this.survey });
        this.$router.push('/surveys');
      } catch (error) {
        console.log(error.response);
        if (error.response.status === 409) {
          this.conflictDialog = true;
        }
      }
    },
  },

  async created() {
    this.editMode = !this.$route.matched.some(
      ({ name }) => name === 'survey-builder-new',
    );

    this.survey._id = ObjectId();

    if (this.editMode) {
      try {
        const { id } = this.$route.params;
        this.survey._id = id;
        const { data } = await api.get(`/surveys/${this.survey._id}`);
        this.survey = data;
      } catch (e) {
        console.log('something went wrong:', e);
      }
    }
  },
};
</script>

<style scoped>
.no-outline {
  outline: none;
}
</style>
