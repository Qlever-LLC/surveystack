<template>
  <v-container
    fluid
    class="pl-8 pr-8"
  >
    <v-row>
      <div class='title'>
        <p>{{ mock[0].name }}</p>
      </div>
    </v-row>
    <v-row>
      <app-text-input
        v-for="(c,idx) in mock[0].controls"
        :key="idx"
        :question="c"
        v-show="idx == questionIdx"
      ></app-text-input>
    </v-row>
    <v-footer
      absolute
      class="font-weight-medium"
    >
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

    </v-footer>
  </v-container>

</template>

<script>
import appTextInput from '@/components/survey/question_types/TextInput.vue';
import mock from '../../mock';

export default {
  components: {
    appTextInput,
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
  },
};
</script>

<style>
.full {
  width: 100%;
}
</style>
