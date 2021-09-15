<template>
  <v-list two-line>
    <v-list-item-group v-model="selected" single active-class="pink--text">
      <template v-for="(question, index) in questions">
        <v-list-item :key="question.number">
          <template v-slot:default="{ active }">
            <v-list-item-content>
              <v-list-item-title v-text="question.control.title"></v-list-item-title>
              <v-list-item-subtitle class="text--primary">{{
                `${question.number}  ${question.control.name}`
              }}</v-list-item-subtitle>
              <v-list-item-subtitle v-text="question.control.label"></v-list-item-subtitle>
            </v-list-item-content>

            <v-list-item-action>
              <v-list-item-action-text v-text="question.control.type"></v-list-item-action-text>
              <v-icon v-if="!active" color="grey lighten-1">
                mdi-star-outline
              </v-icon>

              <v-icon v-else color="yellow">
                mdi-star
              </v-icon>
            </v-list-item-action>
          </template>
        </v-list-item>

        <v-divider v-if="index < questions.length - 1" :key="'div_' + question.number"></v-divider>
      </template>
    </v-list-item-group>
  </v-list>
</template>
<script>
export default {
  data: () => ({
    selected: [],
  }),
  props: {
    questions: {
      type: Array,
      required: true,
    },
  },
};
</script>
