<template>
  <div class="control-adder">
    <a-speed-dial v-model="fabIsOpen" fixed bottom direction="top" transition="fade" class="fab-button" :style="{}">
      <template v-slot:activator>
        <v-btn v-model="fabIsOpen" fab color="blue darken-2" dark data-testid="control-adder-open">
          <a-icon v-if="fabIsOpen">mdi-close</a-icon>
          <a-icon v-else>mdi-plus</a-icon>
        </v-btn>
      </template>
      <template v-slot:default>
        <div class="button-grid">
          <v-btn
            dark
            color="white"
            key="library"
            @click="openLibrary()"
            class="ma-1 d-inline-block shadow green span-button"
            outlined
            small
            data-testid="add-control-library"
          >
            search question library
          </v-btn>
          <v-btn
            dark
            color="white"
            key="group"
            @click="addControl(group)"
            class="ma-1 indigo--text bg-white shadow"
            outlined
            small
            data-testid="add-control-group"
          >
            <a-icon left v-if="group.icon" color="indigo lighten-2">
              {{ group.icon }}
            </a-icon>
            Group
          </v-btn>
          <v-btn
            small
            dark
            color="indigo"
            v-for="el in filteredComponents"
            :key="el.type"
            @click="addControl(el)"
            class="ma-1 d-inline-block shadow"
            :data-testid="'add-control-' + el.type"
          >
            <a-icon dark left v-if="el.icon">
              {{ el.icon }}
            </a-icon>
            {{ el.name.replace('_', ' ') }}
          </v-btn>
        </div>
      </template>
    </a-speed-dial>
  </div>
</template>

<script>
import { availableControls, createControlInstance } from '@/utils/surveyConfig';

const group = availableControls.find((c) => c.type === 'group');

export default {
  data() {
    return {
      group,
      sequence: 0,
      fabIsOpen: false,
    };
  },
  methods: {
    addControl(control) {
      this.sequence += 1;
      const currentSequence = this.sequence;

      const cloneWithDefaults = createControlInstance(control);

      const sequencedControl = {
        ...cloneWithDefaults,
        name: `${control.name}_${currentSequence}`,
        label: `${control.label} ${currentSequence}`,
        hint: '',
      };

      this.$emit('controlAdded', sequencedControl);
    },
    openLibrary() {
      this.$emit('openLibrary');
    },
  },
  computed: {
    filteredComponents() {
      return availableControls.filter(
        (c) =>
          c.type !== 'group' &&
          c.type !== 'library' &&
          (this.$store.getters['toggle/isOn']['feature_resource'] || c.type !== 'file' || c.type !== 'image')
      );
    },
  },
};
</script>

<style scoped>
.button-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 380px;
}

.span-button {
  grid-column: 1 / span 2;
}

.fab-button {
  /* bottom: 40px; */
  /* left: 227px; */
  left: 50%;
  transform: translateX(-50%);
}

.bg-white {
  background-color: white;
}

.shadow {
  /* background: rgba(0, 0, 0, 0.1); */
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
}
</style>
