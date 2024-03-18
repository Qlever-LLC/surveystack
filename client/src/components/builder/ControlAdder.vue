<template>
  <div class="speed-dial-container">
    <a-btn @click="toggleSpeedDial" color="primary" fab class="speed-dial-btn" data-testid="control-adder-open">
      <a-icon x-large>{{ speedDialOpen ? 'mdi-close' : 'mdi-plus' }}</a-icon>
    </a-btn>

    <transition name="fade">
      <div v-if="speedDialOpen" class="speed-dial-actions button-grid">
        <a-btn
          color="white"
          key="library"
          @click="openLibrary()"
          class="ma-1 d-inline-block shadow bg-green span-button"
          variant="outlined"
          small
          data-testid="add-control-library">
          search question library
        </a-btn>
        <a-btn
          color="white"
          key="group"
          @click="addControl(group)"
          class="ma-1 text-indigo bg-white shadow"
          variant="outlined"
          small
          data-testid="add-control-group">
          <a-icon left v-if="group.icon" color="indigo-lighten-2">
            {{ group.icon }}
          </a-icon>
          Group
        </a-btn>
        <a-btn
          small
          color="indigo"
          v-for="el in filteredComponents"
          :key="el.type"
          @click="addControl(el)"
          class="ma-1 d-inline-block shadow"
          :data-testid="'add-control-' + el.type">
          <a-icon left v-if="el.icon">
            {{ el.icon }}
          </a-icon>
          {{ el.name.replace('_', ' ') }}
        </a-btn>
      </div>
    </transition>
  </div>
</template>

<script>
import { createControlInstance, availableControls } from '@/utils/surveyConfig';
const group = availableControls.find((c) => c.type === 'group');

export default {
  data() {
    return {
      group,
      sequence: 0,
      speedDialOpen: false,
    };
  },
  methods: {
    toggleSpeedDial() {
      this.speedDialOpen = !this.speedDialOpen;
    },
    closeSpeedDial() {
      this.speedDialOpen = false;
    },
    addControl(control) {
      this.closeSpeedDial();
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
      this.closeSpeedDial();
      this.$emit('openLibrary');
    },
  },
  computed: {
    filteredComponents() {
      return availableControls.filter(
        (c) =>
          c.type !== 'group' &&
          c.type !== 'library'
      );
    },
  },
};
</script>

<style scoped lang="scss">
.speed-dial-container {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 16px;
  z-index: 1;
}

.speed-dial-btn {
  position: relative;
}

.speed-dial-actions {
  position: absolute;
  bottom: 64px;
  left: -162px;
  z-index: 1;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.button-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 380px;
}

.span-button {
  grid-column: 1 / span 2;
}

.bg-white {
  background-color: white;
}

.shadow {
  /* background: rgba(0, 0, 0, 0.1); */
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
}
</style>
