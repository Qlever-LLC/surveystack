<template>
  <ul>
    <li>
      <div :class="{bold: isFolder}" @click="toggle" @dblclick="makeFolder">
        {{ item.name }}: {{ item.value }}
        <span v-if="isFolder">[{{ isOpen ? '-' : '+' }}]</span>
      </div>
      <ul v-show="isOpen" v-if="isFolder">
        <tree-item
          class="item"
          v-for="(child, index) in item.children"
          :key="index"
          :item="child"
          @make-folder="$emit('make-folder', $event)"
          @add-item="$emit('add-item', $event)"
        ></tree-item>
      </ul>
    </li>
  </ul>
</template>

<script>
export default {
  name: 'tree-item',
  props: {
    item: Object,
  },
  data() {
    return {
      isOpen: false,
    };
  },
  computed: {
    isFolder() {
      return this.item.children && this.item.children.length;
    },
  },
  methods: {
    toggle() {
      if (this.isFolder) {
        this.isOpen = !this.isOpen;
      }
    },
    makeFolder() {
      if (!this.isFolder) {
        this.$emit('make-folder', this.item);
        this.isOpen = true;
      }
    },
  },
};
</script>

<style scoped>
body {
  font-family: Menlo, Consolas, monospace;
  color: #444;
}
.item {
  cursor: pointer;
}
.bold {
  font-weight: bold;
}
ul {
  padding-left: 1em;
  line-height: 1.5em;
  list-style-type: dot;
}
</style>
