<template>
  <div class="wrap">
    <div ref="header" class="mt-heading mt-row">
      <div
        class="caption font-weight-bold text--secondary px-4 mt-cell mt-header"
        v-for="(header, colIdx) in headers"
        :key="colIdx"
        :style="colStyles[colIdx]"
      >
        <slot name="header-cell" v-bind:header="header" v-bind:colIdx="colIdx">
          {{ colIdx }}
        </slot>
      </div>
    </div>
    <v-divider />
    <v-virtual-scroll v-scroll.self="onScroll" :items="rowsWithId" height="300" item-height="64">
      <template v-slot="{ item }">
        <div class="mt-row">
          <div class="px-1 mt-cell" v-for="(header, colIdx) in headers" :key="colIdx" :style="colStyles[colIdx]">
            <slot name="row-cell" v-bind:header="header" v-bind:row="item" v-bind:colIdx="colIdx">
              {{ ' / ' + colIdx }}
            </slot>
          </div>
        </div>
      </template>
    </v-virtual-scroll>
  </div>
</template>

<script>
function defaultColumnWidth(type) {
  switch (type) {
    case 'farmos_planting':
    case 'farmos_field':
      return 240;
    default:
      return 160;
  }
}
export default {
  props: {
    headers: {
      type: Array,
      required: true,
    },
    rows: {
      type: Array,
      required: true,
    },
  },
  computed: {
    rowsWithId() {
      return this.rows.map((row, id) => ({ ...row, id }));
    },
    colStyles() {
      return this.headers.map(({ scaleWidth = 100, type }) => ({
        flexBasis: `${defaultColumnWidth(type) * (scaleWidth / 100)}px`,
      }));
    },
  },
  methods: {
    onScroll(e) {
      this.$refs.header.scrollLeft = e.target.scrollLeft;
    },
  },
};
</script>

<style scoped>
.vue-recycle-scroller {
  height: 300px;
  overflow: auto;
}
.wrap {
  position: relative;
}

.mt-row {
  display: flex;
  flex-wrap: nowrap;
}

.mt-cell {
  flex-shrink: 0;
  flex-grow: 1;
}

.mt-header {
  height: 48px;
  line-height: 48px;
  border-bottom-color: rgba(0, 0, 0, 0.12);
  border-bottom-style: solid;
  border-bottom-width: 0px;
}

.mt-heading {
  height: 50px;
  position: sticky;
  top: 0;
  z-index: 1;
  overflow-x: hidden;
}
</style>
