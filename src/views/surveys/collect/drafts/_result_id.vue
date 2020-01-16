<template>
  <v-container class="pl-8 pr-8">
    <v-row>
      <div class="title">
        <div class="inner-title">{{ mock[0].name }} is a long but complicated name right?</div>
        <div class="subtitle-1 count grey--text text--darken-2">Total<br>{{ mock[0].controls.length + 5254}} Questions</div>
      </div>
      <div class="infos grey--text text--darken-2">
        <div>Question {{ questionIdx + 1 }} <kbd>{{ mock[0].controls[questionIdx].name }}</kbd></div>
      </div>
    </v-row>
    <v-row>

      <component
        :is="currentControl.type"
        :question="currentControl"
      >
      </component>

    </v-row>
    <v-footer
      fixed
      class="font-weight-medium"
    >
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

    </v-footer>
  </v-container>

</template>

<script>
import inputText from '@/components/survey/question_types/TextInput.vue';
import inputNumeric from '@/components/survey/question_types/NumberInput.vue';

import mock from '../../mock';

export default {
  components: {
    inputText,
    inputNumeric,
  },
  data() { return { message: 'hello', mock, questionIdx: 0 }; },
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
    },
    submit() {

    },
  },
  computed: {
    last() {
      return this.questionIdx >= mock[0].controls.length - 1;
    },
    currentControl() {
      return mock[0].controls[this.questionIdx];
    },
  },
};
</script>

<style>
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
</style>
