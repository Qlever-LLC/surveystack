<template>
  <ul v-if="item">
    <li>
      <div
        @click="toggle"
        @dblclick="makeFolder"
      >
        <span class="grey--text text--darken-2">{{ name }}:</span> <strong>{{ item.value }}</strong>
        <span v-if="isFolder">[{{ isOpen ? '-' : '+' }}]</span>
      </div>
      <ul
        v-show="isOpen"
        v-if="isFolder"
      >
        <tree-item
          class="item"
          v-for="(child, name, index) in getChildren(item)"
          :key="index"
          :name="name"
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
    name: String,
  },
  data() {
    return {
      isOpen: false,
    };
  },
  computed: {
    isFolder() {
      if (!this.item || !this.item.meta || !this.item.meta.type) {
        return false;
      }
      return this.item.meta.type === 'group';
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
    getChildren() {
      if (this.item.meta.type !== 'group') {
        return {};
      }

      let children = {};
      Object.keys(this.item).forEach((k) => {
        if (k === 'meta') {
          return;
        }
        children = { ...children, [k]: this.item[k] };
      });

      return children;
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
