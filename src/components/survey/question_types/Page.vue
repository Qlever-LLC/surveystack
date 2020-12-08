<template>
  <v-container fluid>
    <p
      v-if="control.title"
      class="mb-2"
    >{{ control.title }}</p>
    <p class="display-1 grey--text text--darken-3">{{ control.label }} </p>
    <p
      v-if="control.hint"
      class="mt-2"
    >{{ control.hint }}</p>

    <div
      v-for="child in control.children"
      :key="child.name"
    >
      <component
        :is="`app-control-${child.type}`"
        :control="child"
        :value="child.value"
        :index="index"
        @changed="setValue"
      />
    </div>
  </v-container>
</template>

<script>
import baseQuestionComponent from './BaseQuestionComponent';


export default {
  mixins: [baseQuestionComponent],
  methods: {
    setValue(newValue) {
      console.log(newValue);
      this.$emit('changed', newValue);
    },
  },

};
</script>
