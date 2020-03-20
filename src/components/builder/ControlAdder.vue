<template>
  <div class="mt-3 mb-3">
    <v-speed-dial
      v-model="fabIsOpen"
      absolute
      transition="none"
      :style="{ bottom: '40px', left: '200px', transform: 'translateX(-50%)' }"

    >
      <template v-slot:activator>
        <v-btn
          v-model="fabIsOpen"
          fab
          color="blue darken-2"
          dark
        >
          <v-icon v-if="fabIsOpen">mdi-close</v-icon>
          <v-icon v-else>mdi-plus</v-icon>
        </v-btn>
      </template>
      <v-btn
        dark
        color="red"
        key="group"
        @click="addControl(group)"
        class="ma-1"
      >
        Group
      </v-btn>
      <v-btn
        dark
        color="indigo"
        v-for="el in rest"
        :key="el.type"
        @click="addControl(el)"
        class="ma-1"
      >
        <v-icon
          left
          v-if="el.icon"
          color="grey lighten-1"
        >
          {{el.icon}}
        </v-icon>
        {{el.name}}
      </v-btn>
    </v-speed-dial>
  </div>
</template>

<script>
import _ from 'lodash';
import { createControlInstance, availableControls } from '@/utils/surveyConfig';

const group = availableControls.find(c => c.type === 'group');
const rest = availableControls.filter(c => c.type !== 'group');

export default {
  data() {
    return {
      rest,
      group,
      sequence: 0,
      fabIsOpen: false,
    };
  },
  methods: {
    addControl(control) {
      console.log(control);
      this.sequence += 1;
      const currentSequence = this.sequence;

      const cloneWithDefaults = createControlInstance(control);

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
