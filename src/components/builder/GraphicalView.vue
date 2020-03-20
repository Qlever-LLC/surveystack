<template>
  <draggable
    v-if="controls.length !== 0 || index.length !== 0"
    class="draggable list-group"
    tag="div"
    :list="controls"
    :group="{ name: 'g1' }"
    :invertSwap="true"
    :dragOptions="{ animation: 200, }"
    @start="drag = true"
    @end="drag = false"
  >
    <transition-group type="transition" :name="!drag ? 'flip-list' : null">
      <v-card
        v-for="(el, idx) in controls"
        class="control-item mb-2"
        :class="{'control-item-selected': (el === selected)}"
        :key="idx"
        @mousedown.stop.left="$emit('controlSelected', el)"
      >
        <div class="mb-2 d-flex justify-space-between align-center">
          <div>
            <span
              class="caption grey--text text--darken-1"
            >{{ createIndex(index, idx + 1) | displayIndex}}</span>
            <br />
            <span class="title">{{el.label}}</span>
            <br />
            <span class="font-weight-light grey--text text--darken-2">{{ el.name }} : {{ el.type }}</span>
          </div>
          <v-icon
            v-if="selected === el"
            @click.stop="removeAt(idx)"
            color="grey lighten-1"
          >mdi-trash-can-outline</v-icon>
        </div>

        <nested-draggable
          v-if="el.type == 'group'"
          :class="{'drop-area': (el.children.length === 0)}"
          :selected="selected"
          :controls="el.children"
          @controlSelected="$emit('controlSelected', $event)"
          :index="createIndex(index, idx + 1)"
        />
      </v-card>
    </transition-group>
  </draggable>
  <div v-else>
    <v-card>
      <v-card-title>Empty survey</v-card-title>
      <v-card-text>
        <div class="text--primary">You can add questions from the menu on the right.</div>
      </v-card-text>
    </v-card>
  </div>
</template>
<script>
import draggable from 'vuedraggable';

export default {
  name: 'nested-draggable',
  components: {
    draggable,
  },
  data() {
    return {
      drag: false,
    };
  },
  props: {
    controls: {
      required: false,
      type: Array,
    },
    selected: Object,
    index: {
      type: Array,
      default() {
        return [];
      },
    },
  },
  filters: {
    displayIndex(value) {
      return value.join('.');
    },
  },
  methods: {
    log(name) {
      console.log(name);
    },
    removeAt(idx) {
      this.controls.splice(idx, 1);
      this.$emit('controlSelected', null);
    },
    createIndex(current, idx) {
      const newIndex = [...current];
      newIndex.push(idx);
      return newIndex;
    },
  },
};
</script>
<style scoped>
.drop-area {
  min-height: 4rem;
  border-radius: 0.25rem;
  border: 1px solid rgba(0, 0, 0, 0.125);
}

.draggable {
  text-align: left;
  cursor: grab;
  line-height: 1.125rem;
  background: #fff;
}

.control-item:first-child {
  border-top-left-radius: 0.25rem;
  border-top-right-radius: 0.25rem;
}

.control-item {
  padding: 0.75rem 1.25rem;
  border: 1px solid rgba(0, 0, 0, 0.125);
  margin-bottom: -1px;
  /* border-left: 2px solid transparent; */
  border-left-width: 2px;
  position: relative;
}

.control-item:hover::before, .control-item-selected::before {
  position: absolute;
  content: '\F01DD';
  font-family: "Material Design Icons";
  font-size: 28px;
  color: #bbb;
  top: 50%;
  transform: translateY(-50%);
  left: -5px;
}

.control-item-selected {
  border-left: 2px solid var(--v-primary-base);
}


</style>


<style>

.flip-list-move {
  transition: transform 0.5s;
}
.no-move {
  transition: transform 0s;
}

.sortable-ghost {
  opacity: 0.2;
}
</style>
