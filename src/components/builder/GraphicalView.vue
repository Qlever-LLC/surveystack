<template>
  <draggable
    class="draggable list-group"
    tag="div"
    :list="controls"
    :group="{ name: 'g1' }"
    :invertSwap="true"
  >
    <div
      v-for="(el, idx) in controls"
      class="list-group-item"
      :class="{'selected': (el === selected)}"
      :key="el.name"
      @click.stop="$emit('controlSelected', el)"
    >
      {{ el.label }}
      <button
        v-if="selected === el"
        type="button"
        class="close"
        aria-label="Close"
        @click.stop="removeAt(idx)"
      >
        <span aria-hidden="true">&times;</span>
      </button>
      <small class="text-muted d-block mb-2">{{ el.name }} : {{ el.type }}</small>
      <nested-draggable
        v-if="el.type == 'group'"
        class="drop-area"
        :selected="selected"
        :controls="el.children"
        @controlSelected="$emit('controlSelected', $event)"
      />
    </div>
  </draggable>
</template>
<script>
import draggable from 'vuedraggable';

export default {
  components: {
    draggable,
  },
  props: {
    controls: {
      required: false,
      type: Array,
    },
    selected: Object,
  },
  methods: {
    log(name) {
      console.log(name);
    },
    removeAt(idx) {
      this.controls.splice(idx, 1);
      this.$emit('controlSelected', null);
    },
  },
  name: 'nested-draggable',
};
</script>
<style scoped>
.drop-area {
  min-height: 4rem;
  border: 1px solid rgba(0, 0, 0, 0.125);
}

.draggable {
  text-align: left;
  cursor: pointer;
  line-height: 1.125rem;
}

.selected {
  border-left: 2px solid #42b983;
}
</style>
