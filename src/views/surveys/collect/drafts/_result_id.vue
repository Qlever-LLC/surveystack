<template>
  <v-container class="pl-8 pr-8 ">
    <v-row class="flex-grow-0 flex-shrink-1">
      <div class="title">
        <div class="inner-title">{{ survey.name }} is a long but complicated name right?</div>
        <div class="subtitle-1 count grey--text text--darken-2">Total<br>{{ survey.controls.length + 5254}} Questions</div>
      </div>
      <div class="infos grey--text text--darken-2">
        <div v-if="!isGroup"><kbd class="display-1">{{ questionNumber }}</kbd> Question <span class="font-italic blue--text">{{ currentControl.name }}</span></div>
        <div v-else><kbd class="display-1">{{ questionNumber }}</kbd> Group <span class="font-italic blue--text">{{ currentControl.name }}</span></div>
      </div>
    </v-row>
    <v-row class="flex-grow-0 flex-shrink-1">
      <div
        v-if="breadcrumbs.length > 0"
        class="infos grey--text text--darken-2 mt-2"
        v-html="breadcrumbs"
      > </div>
    </v-row>
    <v-row
      justify="center"
      align="center"
      class="flex-grow-1 flex-shrink-0"
      style="min-width: 100px; max-width: 100%;"
    >
      <component
        :is="currentControl.type"
        :control="currentControl"
        :position="surveyPositions[controlIndex]"
        :instance="instance"
        :controlIndex="controlIndex"
      >
      </component>
    </v-row>
    <div class="font-weight-medium footer">
      <v-container class="pl-8 pr-8">
        <v-row>
          <v-col
            class="text-center"
            cols="6"
          >
            <v-btn
              @click="prev"
              class="full"
              outlined
              depressed
              large
              color="primary"
            >Preivous</v-btn>
          </v-col>

          <v-col
            v-if="last"
            class="text-center"
            cols="6"
          >
            <v-btn
              @click="submit"
              class="full"
              depressed
              large
              color="primary"
            >Submit</v-btn>
          </v-col>
          <v-col
            v-else
            class="text-center"
            cols="6"
          >
            <v-btn
              @click="next"
              class="full"
              depressed
              large
              color="primary"
            >Next</v-btn>
          </v-col>
        </v-row>
      </v-container>

    </div>
  </v-container>
</template>

<script>
import _ from 'lodash';
import ObjectId from 'bson-objectid';
import inputText from '@/components/survey/question_types/TextInput.vue';
import inputNumeric from '@/components/survey/question_types/NumberInput.vue';
import group from '@/components/survey/question_types/Group.vue';
import * as utils from '@/utils/surveys';


export default {
  components: {
    inputText,
    inputNumeric,
    group,
  },
  data() {
    return {
      survey: null,
      surveyPositions: null,
      controlIndex: 0,
      instance: null,
    };
  },

  methods: {
    prev() {
      if (this.controlIndex > 0) {
        this.controlIndex -= 1;
      }
    },
    next() {
      if (!this.last) {
        this.controlIndex += 1;
      }
    },
    submit() {

    },
    calculateControl() {
      if (
        !this.currentControl.options.calculate || this.currentControl.options.calculate === ''
      ) {
        return;
      }
      const sandbox = utils.compileSandboxSingleLine(this.currentControl.options.calculate);
      this.currentControl.value = sandbox({ data: this.instanceData });
    },
  },
  computed: {
    last() {
      return this.controlIndex >= this.surveyPositions.length - 1;
    },
    currentControl() {
      return utils.getControl(this.survey, this.surveyPositions[this.controlIndex]);
    },
    breadcrumbs() {
      const ret = utils.getBreadcrumbs(this.survey, this.surveyPositions[this.controlIndex]);
      ret.splice(-1, 1);
      return ret.map(txt => `<kbd>${txt}</kbd>`).join(' &gt; ');
    },
    questionNumber() {
      const edited = this.surveyPositions[this.controlIndex].map(value => value + 1);
      return edited.join('.');
    },
    isGroup() {
      return utils.getControl(this.survey, this.surveyPositions[this.controlIndex]).type === 'group';
    },
    instanceData() {
      return utils.getInstanceData(this.instance);
    },
  },

  async created() {
    try {
      // const { id } = this.$route.params;
      // const { data } = await api.get(`/surveys/${id}`);
      this.survey._id = ObjectId();

      this.survey = utils.mockSurvey;
      this.instance = _.cloneDeep(this.survey);
      this.positions = utils.getSurveyPositions(this.survey);
    } catch (e) {
      console.log('something went wrong:', e);
    }
  },
};
</script>

<style scoped>
.full {
  width: 100%;
}

.count {
  flex-grow: 0;
}

.title {
  /* align-items: center; */
  line-height: 1.5rem !important;
  width: 100%;
  display: flex;
  justify-content: space-between;
  flex-wrap: nowrap;
  margin: 0.2rem 0;
}

.inner-title {
  flex-basis: 0;
  flex-grow: 1;
}

.pack {
  flex-basis: 0 !important;
}

.footer {
  border-top: 1px solid #ccc;
  background: #fff;
  margin: 0;
  border-radius: 0;
  -webkit-box-align: center;
  align-items: center;
  display: flex;
  -webkit-box-flex: 0 !important;
  flex: 0 1 auto !important;
  flex-wrap: wrap;
  padding: 6px 16px;
  transition-duration: 0.2s;
  transition-property: background-color, left, right;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
  position: fixed;
  left: 0px;
  right: 0px;
  bottom: 0px;
}
</style>
