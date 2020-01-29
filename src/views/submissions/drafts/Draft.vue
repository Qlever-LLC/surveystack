
<template>
  <v-container
    v-if="instance"
    id="question-container"
  >
    <kbd>{{ control }}</kbd>
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
        :key="breadcrumbs.join('.')"
        :is="control.type"
        v-bind="controlArgs"
      ></component>
    </v-row>

    <!--
    <form>
      <div class="form-group">
        <label for="survey-question">
          <h3>{{control.label}}</h3>
        </label>
        <input
          v-if="showInput"
          class="form-control"
          id="survey-question"
          name="survey-question"
          v-model="control.value"
        />
      </div>
      <div class="d-flex justify-content-end">
        <button
          type="button"
          class="btn btn-outline-primary mr-2"
          @click="previous"
          v-show="!atStart"
        >Previous</button>
        <button
          type="submit"
          class="btn btn-primary"
          @click.prevent="next"
        >{{ atEnd ? "Submit" : "Next"}}</button>
      </div>
    </form>
    -->
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


import {
  getControl,
  getBreadcrumbs,
  getInstanceData,
  getSurveyPositions,
  compileSandboxSingleLine,
  createInstance,
  createInstancePayload,
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
    };
  },
  watch: {
    control: {
      // eslint-disable-next-line func-names
      handler(val, oldVal) {
        console.log(`value: ${oldVal} => ${val}`);
      },
      deep: true,
    },

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
    computedControl() {
      console.log('computedControl');
      return {
        v: this.fakeControl.value,
      };
    },
    controlArgs() {
      console.log('computing controlargs');
      // eslint-disable-next-line no-unused-vars
      return {
        control: this.control,
        eval(expr) {
          const sandbox = compileSandboxSingleLine(expr);
          return sandbox({ data: this.instanceData });
        },
        changed(v) {
          console.log('changed', this.$parent);
          this.$parent.setValue(v);
        },
        showNav() {
          console.log('shownav');
          this.$parent.showNav(true);
        },
        hideNav() {
          this.$parent.showNav(false);
        },
        hideNext() {
          this.$parent.showNext(false);
        },
        showNext() {
          this.$parent.showNext(true);
        },
        next() {
          this.$parent.next();
        },
      };
    },
  },
  methods: {
    showNav(visible) {
      this.mShowNav = visible;
    },
    showNext(visible) {
      this.mShowNext = visible;
    },
    setValue(v) {
      console.log('setting value', v);
      this.control.value = v;
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
      this.breadcrumbs = getBreadcrumbs(
        this.survey.versions[this.version],
        this.positions[this.index],
      );
    },
    calculateControl() {
      console.log(this.control);
      if (
        !this.control.options.calculate
        || this.control.options.calculate === ''
      ) {
        return;
      }
      const sandbox = compileSandboxSingleLine(this.control.options.calculate);
      this.control.value = sandbox({ data: this.instanceData });
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
      const { survey } = this.$route.query;
      const { data } = await api.get(`/surveys/${survey}`);
      this.survey = data;

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
      this.breadcrumbs = getBreadcrumbs(
        this.survey.versions[this.version],
        this.positions[this.index],
      );
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

#question-container {
}
</style>
