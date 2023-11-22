<template>
  <a-list two-line>
    <v-list-item-group v-model="selected" single active-class="pink--text">
      <template v-for="(question, index) in questions">
        <a-list-item :key="question.number">
          <template v-slot:default="{ active }">
            <v-list-item-content>
              <a-list-item-title v-text="question.control.title"></a-list-item-title>
              <a-list-item-subtitle class="text--primary">{{
                `${question.number}  ${question.control.name}`
              }}</a-list-item-subtitle>
              <a-list-item-subtitle v-text="question.control.label"></a-list-item-subtitle>
            </v-list-item-content>

            <a-list-item-action>
              <v-list-item-action-text v-text="question.control.type"></v-list-item-action-text>
              <a-icon v-if="!active" color="grey lighten-1"> mdi-star-outline </a-icon>

              <a-icon v-else color="yellow"> mdi-star </a-icon>
            </a-list-item-action>
          </template>
        </a-list-item>

        <a-divider v-if="index < questions.length - 1" :key="'div_' + question.number" />
      </template>
    </v-list-item-group>
  </a-list>
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
