<template>
  <div class="control-adder">
    <v-speed-dial
      v-model="fabIsOpen"
      fixed
      bottom
      direction="top"
      transition="fade"
      class="fab-button"
      :style="{  }"

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
      <template v-slot:default>
        <div class="button-grid">
          <v-btn
            dark
            color="white"
            key="group"
            @click="addControl(group)"
            class="ma-1 indigo--text bg-white shadow"
            outlined
            small
          >
            <v-icon
              left
              v-if="group.icon"
              color="indigo lighten-2"
            >
              {{group.icon}}
            </v-icon>
            Group
          </v-btn>
          <v-btn
            small
            dark
            color="indigo"
            v-for="el in rest"
            :key="el.type"
            @click="addControl(el)"
            class="ma-1 d-inline-block shadow"
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
        </div>
      </template>
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

<style scoped>
.button-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 340px;
}

.fab-button {
  /* bottom: 40px; */
  /* left: 227px; */
  left: 50%;
  transform: translateX(-50%);

}

/* .control-adder >>> .v-speed-dial--direction-top .v-speed-dial__list,
.control-adder >>> .v-speed-dial--direction-bottom .v-speed-dial__list {
  with
} */

.bg-white {
  background-color: white;
}

.shadow {
  /* background: rgba(0, 0, 0, 0.1); */
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
}
</style>
