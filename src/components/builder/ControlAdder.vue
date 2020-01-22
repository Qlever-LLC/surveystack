<template>
  <div class="mt-3 mb-3">
    <v-btn
      v-for="el in availableControls"
      :key="el.type"
      @click="addControl(el)"
      class="mr-1"
    >{{el.name}}</v-btn>
  </div>
</template>

<script>
import _ from 'lodash';
import { defaultControlOptions, availableControls } from '@/utils/surveyConfig';

export default {
  data() {
    return {
      availableControls,
      sequence: 0,
    };
  },
  methods: {
    addControl(control) {
      this.sequence += 1;
      const currentSequence = this.sequence;

      const clone = _.cloneDeep(control);
      const cloneWithDefaults = Object.assign(clone, {
        options: defaultControlOptions,
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
