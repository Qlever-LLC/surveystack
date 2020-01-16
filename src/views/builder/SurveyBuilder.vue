<template>
  <v-container>
    <v-row>
      <v-col cols="7">
        <div class="d-flex justify-content-between align-items-center">
          <h2>Survey Builder</h2>
          <small v-if="!showCode">
            <a @click.prevent="showCode = true" href="./view?showCode=true">view code</a>
          </small>
          <small v-else @click="showCode = false">
            <a @click.prevent="showCode = true" href="./view?showCode=false">view graphical</a>
          </small>
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
          <survey-details v-model="survey" :editMode="editMode" />
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

export default {
  components: {
    graphicalView,
    codeView,
    controlProperties,
    controlAdder,
    surveyDetails,
  },
  methods: {
    controlSelected(control) {
      this.control = control;
    },
    controlAdded(control) {
      this.survey.controls.push(control);
      this.control = control;
    },
  },
  data() {
    return {
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
