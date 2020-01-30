
<template>
  <v-container
    v-if="instance && survey"
    id="question-container"
  >
    <v-row class="flex-grow-0 flex-shrink-1 pl-2 pr-2 pb-2">
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
    <v-row
      class="flex-grow-0 flex-shrink-1"
      v-if="mbreadcrumbs.length > 0"
    >
      <div
        class="infos grey--text text--darken-2 mt-2"
        v-html="mbreadcrumbs"
      ></div>
    </v-row>

    <v-row
      justify="center"
      align="center"
      class="px-2"
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
        @show-next="showNext(true)"
        @hide-next="showNext(false)"
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
              :disabled="!mShowNext"
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
              :disabled="!mShowNext"
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


function updateTitle(vm) {
  vm.$store.dispatch('appui/title', vm.survey.name);
  vm.$store.dispatch('appui/subtitle', `Version ${vm.version} <kbd>${vm.positions.length} Questions</kbd>`);
}

export default {
  components: {
    inputText,
    inputNumeric,
    inputLocation,
    group,
  },
  data() {
    return {
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
  },
  methods: {
    eval() { },
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
  watch: {
    control(newControl, oldControl) {
      //
    },
  },
  beforeDestroy() {
    this.$store.dispatch('appui/reset');
  },
  async created() {
    try {
      const { id } = this.$route.params;
      const { survey } = this.$route.query;

      db.openDb(async () => {
        if (!id) {
          let data = {};

          try {
            // eslint-disable-next-line prefer-destructuring
            data = (await api.get(`/surveys/${survey}`)).data;
          } catch (error) {
            console.log('using cached data');
            data = (await new Promise((resolve) => {
              db.getAllSurveys(surveys => resolve(surveys));
            })).find(s => s._id === survey);
          }

          this.survey = data;

          console.log(this.survey);


          this.version = this.survey.versions.length - 1;
          if (this.version < 0) {
            console.log('invalid version', this.version);
            return;
          }

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

          updateTitle(this);
        } else {
          console.log('loading existing submissing', id);
          db.getAllSurveyResults(async (results) => {
            console.log(results);
            this.instance = results.find(i => i._id === id);
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

            updateTitle(this);
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
