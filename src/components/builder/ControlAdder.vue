<template>
  <div class="mt-3 mb-3">
    <v-btn
      dark
      color="red"
      key="group"
      @click="addControl(group)"
      class="ma-1"
    >Group</v-btn>
    <v-divider class="my-4"></v-divider>
    <v-btn
      dark
      color="indigo"
      v-for="el in rest"
      :key="el.type"
      @click="addControl(el)"
      class="ma-1"
    >{{el.name}}</v-btn>
  </div>
</template>

<script>
import _ from 'lodash';
import { defaultControlOptions, availableControls } from '@/utils/surveyConfig';

const group = availableControls.find(c => c.type === 'group');
const rest = availableControls.filter(c => c.type !== 'group');

export default {
  data() {
    return {
      rest,
      group,
      sequence: 0,
    };
  },
  methods: {
    addControl(control) {
      console.log(control);
      this.sequence += 1;
      const currentSequence = this.sequence;

      const clone = _.cloneDeep(control);

      const cloneWithDefaults = Object.assign(clone, {
        options: _.cloneDeep(defaultControlOptions),
      });

      const sequencedControl = {
        ...cloneWithDefaults,
        name: `${control.name}_${currentSequence}`,
        label: `${control.label} ${currentSequence}`,
      };

      this.$emit('controlAdded', sequencedControl);
    },
  },
};
</script>
