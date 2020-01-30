
<template>
  <v-container
    v-if="instance && survey"
    id="question-container"
  >
    <v-row class="flex-grow-0 flex-shrink-1 pl-2 pr-2 pb-2">
      <div class="title">
        <div class="inner-title">
          {{ survey.name }}
          <small>Version {{version}}</small>
        </div>
        <div class="subtitle-1 count grey--text text--darken-2">Total {{positions.length}} Questions</div>
      </div>
      <div class="infos grey--text text--darken-2">
        <div v-if="control.type !== 'group'">
          <kbd class="display-1">{{ questionNumber }}</kbd> Question
          <span class="font-italic blue--text">{{ control.name }}</span>
        </div>
        <div v-else>
          <kbd class="display-1">{{ questionNumber }}</kbd> Group
          <span class="font-italic blue--text">{{ control.name }}</span>
        </div>
      </div>
    </v-row>
    <v-row class="flex-grow-0 flex-shrink-1">
      <div
        v-if="mbreadcrumbs.length > 0"
        class="infos grey--text text--darken-2 mt-2"
        v-html="mbreadcrumbs"
      ></div>
    </v-row>

    <v-row
      justify="center"
      align="center"
      class="flex-grow-1 flex-shrink-0"
      style="min-width: 100px; max-width: 100%;"
    >
      <component
        class="tall"
        :key="breadcrumbs.join('.')"
        :is="control.type"
        :control="control"
        :value="value"
        @eval="eval"
        @changed="setValue"
        @show-nav="showNav(true)"
        @hide-nav="showNav(false)"
        @next="next"
        @hide-next="showNext(false)"
        @show-next="showNext(true)"
      ></component>
    </v-row>

    <div
      v-if="mShowNav"
      class="font-weight-medium footer"
    >
      <v-container class="pa-0">
        <v-row>
          <v-col
            class="text-center"
            cols="6"
          >
            <v-btn
              v-show="!atStart"
              @click="previous"
              class="full"
              outlined
              depressed
              large
              color="primary"
            >Previous</v-btn>
          </v-col>

          <v-col
            v-if="atEnd"
            class="text-center"
            cols="6"
          >
            <v-btn
              v-if="mShowNext"
              @click="next"
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
              v-if="mShowNext"
              @click="next"
              @keyup.enter="next"
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
import api from '@/services/api.service';

import inputText from '@/components/survey/question_types/TextInput.vue';
import inputNumeric from '@/components/survey/question_types/NumberInput.vue';
import inputLocation from '@/components/survey/question_types/Map.vue';
import group from '@/components/survey/question_types/Group.vue';
import * as db from '@/store/db';


import {
  getControl,
  getBreadcrumbs,
  getInstanceData,
  getSurveyPositions,
  compileSandboxSingleLine,
  createInstance,
  createInstancePayload,
  getControlPositions,
} from '@/utils/surveys';

export default {
  components: {
    inputText,
    inputNumeric,
    inputLocation,
    group,
  },
  data() {
    return {
      activeSubmission: null,
      activeSurvey: null,
      // activeSurveyId: null,
      survey: null,
      control: null,
      instance: null,
      instanceData: null,
      positions: null,
      breadcrumbs: [],
      index: 0,
      mShowNav: true,
      mShowNext: true,
      version: 0,
      value: null,
    };
  },
  computed: {
    totalQuestions() {
      return 13;
    },
    atStart() {
      return this.index === 0;
    },
    atEnd() {
      return this.index >= this.positions.length - 1;
    },
    showInput() {
      if (this.control.type === 'group') {
        return false;
      }

      return true;
    },
    questionNumber() {
      const edited = this.positions[this.index].map(value => value + 1);
      return edited.join('.');
    },
    mbreadcrumbs() {
      const ret = getBreadcrumbs(
        this.survey.versions[this.version],
        this.positions[this.index],
      );
      ret.splice(-1, 1);
      return ret.map(txt => `<kbd>${txt}</kbd>`).join(' &gt; ');
    },
    example() {
      return {
        hello: 'world',
      };
    },
    draftId() {
      return this.$route.params && this.$route.params.id;
    },
    surveyId() {
      return this.$route.query && this.$route.query.survey;
    },
    isNewSubmission() {
      return !this.draftId && !!this.surveyId;
    },
    activeVersion() {
      return this.isNewSubmission
        ? this.activeSurvey.versions.length - 1
        : this.activeSubmission.meta.version;
    },
  },
  methods: {
    eval() {},
    showNav(visible) {
      this.mShowNav = visible;
    },
    showNext(visible) {
      this.mShowNext = visible;
    },
    setValue(v) {
      // TODO change modified timestamp, persist
      console.log('setValue', v);
      this.$set(this.control, 'value', v);
      this.value = v;
      this.instance.meta.modified = new Date().getTime();
      this.persist();
      this.$forceUpdate();
    },
    next() {
      this.showNav(true);
      this.showNext(true);
      if (this.atEnd) {
        const payload = createInstancePayload(
          this.instance,
          this.survey.versions[this.version],
        );
        console.log('payload', payload);
        this.submit(payload);
        return;
      }
      this.index++;
      this.instanceData = getInstanceData(this.instance);
      this.control = getControl(this.instance.data, this.positions[this.index]);
      this.value = this.control.value;
      this.breadcrumbs = getBreadcrumbs(
        this.survey.versions[this.version],
        this.positions[this.index],
      );
      this.calculateControl();
    },
    previous() {
      this.showNav(true);
      this.showNext(true);
      if (this.atStart) {
        return;
      }
      this.index--;
      this.control = getControl(this.instance.data, this.positions[this.index]);
      this.value = this.control.value;
      this.breadcrumbs = getBreadcrumbs(
        this.survey.versions[this.version],
        this.positions[this.index],
      );
    },
    calculateControl() {
      if (
        !this.control.options.calculate
        || this.control.options.calculate === ''
      ) {
        return;
      }
      const sandbox = compileSandboxSingleLine(this.control.options.calculate);
      this.control.value = sandbox({ data: this.instanceData });
      this.value = this.control.value;
      console.log(this.control.value);
    },
    questions() {
      if (!this.surveyPositions) {
        return [];
      }

      return this.surveyPositions.map(pos => ({
        number: pos.map(v => v + 1).join('.'),
        control: this.controlFromPosition(pos),
      }));
    },
    persist() {
      db.persistSurveyResult(this.instance);
    },
    async submit(payload) {
      try {
        await api.post('/submissions', payload);
        this.$router.push('/surveys/browse');
      } catch (error) {
        console.log(error);
      }
    },
  },

  async created() {
    try {
      /**
       * Page will either be loaded with query parameter for survey definition ID or
       * route parameter for draft ID
       */
      const { id: draftId } = this.$route.params;
      const { survey: surveyId } = this.$route.query;

      // const isNewSubmission = !draftId;

      if (draftId) {
        /** Either fetch all submissions then use getter, or use GET_SUBMISSION action, which automatically does this. */
        // await this.$store.dispatch('submissions/fetchSubmissions');
        // this.$store.getters['submissions/getSubmission'](draftId);
        this.activeSubmission = await this.$store.dispatch('submissions/GET_SUBMISSION', draftId);
        // this.activeSurveyId = this.activeSubmission.survey;
        // console.log('activeSubmission', this.activeSubmission);
      }

      this.activeSurvey = await this.$store.dispatch(
        'surveys/fetchSurvey',
        surveyId || (this.activeSubmission && this.activeSubmission.survey),
      );
      // console.log('activeSurvey', this.activeSurvey);


      db.openDb(async () => {
        if (!draftId) {
          /** draftId does not exist, create new submission for definition of surveyId */
          let data = {};

          /** This block should be abstracted into VueX store call,
           * which calls Surveys Service, which automatically handles
           * loading from cache vs API
           * */
          try {
            // eslint-disable-next-line prefer-destructuring
            data = (await api.get(`/surveys/${surveyId}`)).data;
          } catch (error) {
            console.log('using cached data');
            data = (await new Promise((resolve) => {
              db.getAllSurveys(surveys => resolve(surveys));
            })).find(s => s._id === surveyId);
          }

          this.survey = data;

          console.log(this.survey);

          /** Moved to activeVersion computed value */
          this.version = this.survey.versions.length - 1;
          if (this.version < 0) {
            console.log('invalid version', this.version);
            return;
          }

          /** Can these be put into computed properties or VueX getters?
           * the functionality is common with the draftId does exist case below, should be
           * abstracted.
          */
          this.instance = createInstance(this.survey, this.version);
          this.positions = getSurveyPositions(this.survey, this.version);
          this.instanceData = getInstanceData(this.instance);

          this.index = 0;
          this.control = getControl(this.instance.data, this.positions[this.index]);
          this.value = this.control.value;
          this.breadcrumbs = getBreadcrumbs(
            this.survey.versions[this.version],
            this.positions[this.index],
          );
        } else {
          /** draftId does exist, edit existing submission */
          console.log('loading existing submission', draftId);
          db.getAllSurveyResults(async (results) => {
            console.log(results);
            this.instance = results.find(i => i._id === draftId);
            if (!this.instance) {
              // TODO instance not found
              return;
            }

            console.log('instance', this.instance);

            console.log('fetching survey');
            let data = {};

            try {
              // eslint-disable-next-line prefer-destructuring
              data = (await api.get(`/surveys/${this.instance.survey}`)).data;
            } catch (error) {
              console.log('using cached data');
              data = (await new Promise((resolve) => {
                db.getAllSurveys(surveys => resolve(surveys));
              })).find(s => s._id === this.instance.survey);
            }

            this.survey = data;
            /** Moved to activeVersion computed value */
            this.version = this.instance.meta.version;


            console.log('getting control positions');
            this.positions = getControlPositions(this.instance.data);

            console.log('getting instance data');
            this.instanceData = getInstanceData(this.instance);

            this.index = 0;

            console.log('getting control');
            this.control = getControl(this.instance.data, this.positions[this.index]);
            this.value = this.control.value;

            console.log('getting breadcrumbs');

            console.log('survey', this.survey);
            this.breadcrumbs = getBreadcrumbs(
              this.survey.versions[this.version],
              this.positions[this.index],
            );
          });
        }
      });
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
  z-index: 1;
  position: fixed;
  left: 0px;
  right: 0px;
  bottom: 0px;
}

.tall {
  padding-bottom: 20vh;
}

#question-container {

}
</style>
