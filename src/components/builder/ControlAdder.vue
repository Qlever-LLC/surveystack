<template>
  <div class="mb-3">
    <button
      v-for="el in availableControls"
      class="btn btn-outline-primary mr-2 mb-2"
      :key="el.type"
      @click="addControl(el)"
    >{{el.name}}</button>
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
