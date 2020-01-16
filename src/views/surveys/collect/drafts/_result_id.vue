<template>
  <v-container
    class="pl-8 pr-8 "
  >
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
        :position="surveyPositions[questionIdx]"
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
      message: 'hello',
      survey: utils.mockSurvey,
      surveyPositions: utils.getSurveyPositions(utils.mockSurvey),
      questionIdx: 0,
      instance: {},
    };
  },
  methods: {
    prev() {
      if (this.questionIdx > 0) {
        this.questionIdx -= 1;
      }
    },
    next() {
      if (!this.last) {
        this.questionIdx += 1;
      }
      console.log(this.instance);
    },
    submit() {

    },
  },
  computed: {
    last() {
      return this.questionIdx >= this.surveyPositions.length - 1;
    },
    currentControl() {
      return utils.getControl(this.survey, this.surveyPositions[this.questionIdx]);
    },
    breadcrumbs() {
      const ret = utils.getBreadcrumbs(this.survey, this.surveyPositions[this.questionIdx]);
      ret.splice(-1, 1);
      return ret.map(txt => `<kbd>${txt}</kbd>`).join(' &gt; ');
    },
    questionNumber() {
      const edited = this.surveyPositions[this.questionIdx].map(value => value + 1);
      return edited.join('.');
    },
    controlIndex() {
      return utils.getInstanceIndex(this.survey, this.surveyPositions[this.questionIdx]);
    },
    isGroup() {
      return utils.getControl(this.survey, this.surveyPositions[this.questionIdx]).type === 'group';
    },
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
